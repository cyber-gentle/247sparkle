import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { calculatePercentageKobo, koboToNaira } from '@/lib/money';
import {
  assertOrderTransition,
  LAUNDRY_FULFILMENT_STATUSES,
  ON_SITE_STATUSES,
  type OrderStatus,
} from '@/lib/order-state';

type DatabaseTransaction = Prisma.TransactionClient;

export type PaymentConfirmationInput = {
  reference: string;
  amountKobo: number;
  currency?: string;
  status: string;
  eventType: 'charge.success' | 'verification';
  payloadHash?: string;
};

export type PaymentConfirmationResult =
  | {
      ok: true;
      alreadyProcessed: boolean;
      order: Awaited<ReturnType<typeof prisma.order.findUnique>>;
    }
  | { ok: false; reason: 'NOT_SUCCESS' | 'AMOUNT_MISMATCH' | 'CURRENCY_MISMATCH' };

function paymentPayloadHash(input: PaymentConfirmationInput): string {
  return (
    input.payloadHash ??
    crypto
      .createHash('sha256')
      .update(`${input.reference}:${input.amountKobo}:${input.currency ?? ''}:${input.status}`)
      .digest('hex')
  );
}

export async function confirmOrderPayment(
  order: { id: string; totalKobo: number },
  input: PaymentConfirmationInput
): Promise<PaymentConfirmationResult> {
  if (input.status !== 'success') {
    return { ok: false, reason: 'NOT_SUCCESS' };
  }
  if (input.amountKobo !== order.totalKobo) {
    return { ok: false, reason: 'AMOUNT_MISMATCH' };
  }
  if (input.currency && input.currency !== 'NGN') {
    return { ok: false, reason: 'CURRENCY_MISMATCH' };
  }

  const eventIdentity = {
    provider_reference: {
      provider: 'PAYSTACK',
      reference: input.reference,
    },
  };

  try {
    const outcome = await prisma.$transaction(async (tx: DatabaseTransaction) => {
      const existingEvent = await tx.paymentEvent.findUnique({ where: eventIdentity });
      if (existingEvent) {
        return {
          alreadyProcessed: true,
          order: await tx.order.findUnique({
            where: { id: order.id },
            include: { items: true, customer: true },
          }),
        };
      }

      await tx.paymentEvent.create({
        data: {
          reference: input.reference,
          eventType: input.eventType,
          payloadHash: paymentPayloadHash(input),
          orderId: order.id,
        },
      });

      await tx.order.updateMany({
        where: { id: order.id, paymentStatus: { not: 'PAID' } },
        data: {
          paymentStatus: 'PAID',
          status: 'PAID_UNASSIGNED',
          paymentConfirmedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_CONFIRMED',
          entityType: 'ORDER',
          entityId: order.id,
          changes: JSON.stringify({ reference: input.reference, amountKobo: input.amountKobo }),
        },
      });

      return {
        alreadyProcessed: false,
        order: await tx.order.findUnique({
          where: { id: order.id },
          include: { items: true, customer: true },
        }),
      };
    });

    return { ok: true, ...outcome };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existingOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true, customer: true },
      });
      return { ok: true, alreadyProcessed: true, order: existingOrder };
    }
    throw error;
  }
}

export async function assignRiderToPaidOrder({
  orderId,
  riderId,
  actorUserId,
}: {
  orderId: string;
  riderId: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx: DatabaseTransaction) => {
    const assignment = await tx.order.updateMany({
      where: {
        id: orderId,
        riderId: null,
        paymentStatus: 'PAID',
        status: 'PAID_UNASSIGNED',
      },
      data: { riderId, status: 'RIDER_ASSIGNED' },
    });

    if (assignment.count !== 1) {
      return null;
    }

    const assignedOrder = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { user: { select: { fullName: true, phone: true, email: true } } } },
        rider: { include: { user: { select: { fullName: true, phone: true, email: true } } } },
      },
    });

    if (!assignedOrder) {
      throw new Error('Assigned order could not be loaded');
    }

    const commissionKobo = calculatePercentageKobo(assignedOrder.totalKobo, 20);
    await tx.commission.upsert({
      where: { orderId_riderId: { orderId, riderId } },
      create: {
        riderId,
        orderId,
        amountKobo: commissionKobo,
        amount: koboToNaira(commissionKobo),
        status: 'PENDING',
      },
      update: {},
    });

    await tx.auditLog.create({
      data: {
        action: 'RIDER_ASSIGNED',
        entityType: 'ORDER',
        entityId: orderId,
        userId: actorUserId,
        changes: JSON.stringify({ riderId, commissionKobo }),
      },
    });

    return assignedOrder;
  });
}

// Active partner-side statuses: the order is at (or heading to) the shop.
const PARTNER_ACTIVE_STATUSES = ['PICKED_UP', 'IN_CLEANING'] as const;

/**
 * Pick the partner an order should auto-route to on pickup: an APPROVED
 * partner whose workload toggle is AVAILABLE, with the fewest orders
 * currently at their shop. Ties break deterministically by id so repeated
 * runs don't flip-flop.
 *
 * Returns null when no partner is available — the caller treats that as
 * "leave it for manual routing", never as an error.
 */
async function findAvailablePartner(tx: DatabaseTransaction) {
  const candidates = await tx.partner.findMany({
    where: { approvalStatus: 'APPROVED', workloadStatus: 'AVAILABLE' },
    select: {
      id: true,
      _count: { select: { assignedOrders: { where: { status: { in: [...PARTNER_ACTIVE_STATUSES] } } } } },
    },
    orderBy: { id: 'asc' },
  });
  if (candidates.length === 0) return null;

  return candidates.reduce((best, candidate) =>
    candidate._count.assignedOrders < best._count.assignedOrders ? candidate : best
  );
}

export async function transitionPaidOrder({
  orderId,
  currentStatus,
  nextStatus,
  actorUserId,
}: {
  orderId: string;
  currentStatus: string;
  nextStatus: OrderStatus;
  actorUserId: string;
}) {
  assertOrderTransition(currentStatus, nextStatus);

  return prisma.$transaction(async (tx: DatabaseTransaction) => {
    // The rider requirement applies to laundry fulfilment only: on-site
    // services (fumigation, cleaning) are completed by a visiting team and
    // never have a rider. Guard the service-type/status pairing here too, so
    // a laundry order can never skip into the on-site track (or vice versa)
    // regardless of what the caller validated.
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { serviceType: true },
    });
    const isLaundry = order?.serviceType === 'LAUNDRY';

    if (isLaundry && (ON_SITE_STATUSES as readonly string[]).includes(nextStatus)) {
      throw new Error(`Laundry orders cannot transition to ${nextStatus}`);
    }
    if (!isLaundry && (LAUNDRY_FULFILMENT_STATUSES as readonly string[]).includes(nextStatus)) {
      throw new Error(`On-site service orders cannot transition to ${nextStatus}`);
    }

    const transition = await tx.order.updateMany({
      where: {
        id: orderId,
        status: currentStatus,
        paymentStatus: 'PAID',
        // Laundry fulfilment requires a rider; on-site orders have none.
        ...(isLaundry ? { riderId: { not: null } } : {}),
      },
      data: { status: nextStatus },
    });

    if (transition.count !== 1) {
      return null;
    }

    await tx.auditLog.create({
      data: {
        action: 'ORDER_STATUS_CHANGED',
        entityType: 'ORDER',
        entityId: orderId,
        userId: actorUserId,
        changes: JSON.stringify({ from: currentStatus, to: nextStatus }),
      },
    });

    // Pickup is the trigger for partner auto-routing: the rider has the
    // clothes, so the system immediately routes them to an available shop
    // instead of waiting for an admin. Failure to find a partner is NOT an
    // error — the order simply stays PICKED_UP for manual routing.
    // Guarded on partnerId: null so this is idempotent and can never
    // overwrite a manual routing decision made concurrently.
    if (nextStatus === 'PICKED_UP') {
      const partner = await findAvailablePartner(tx);
      if (partner) {
        const routed = await tx.order.updateMany({
          where: { id: orderId, partnerId: null },
          data: { partnerId: partner.id },
        });
        if (routed.count === 1) {
          await tx.auditLog.create({
            data: {
              action: 'PARTNER_AUTO_ASSIGNED',
              entityType: 'ORDER',
              entityId: orderId,
              userId: actorUserId,
              changes: JSON.stringify({
                partnerId: partner.id,
                strategy: 'fewest-active-orders',
              }),
            },
          });
        }
      }
    }

    // COMPLETED is terminal in the state machine, so the guarded updateMany
    // above can only succeed once per order. Crediting here is therefore
    // idempotent by construction — a replayed or racing transition finds the
    // order already COMPLETED, gets count 0, and returns before this block.
    if (nextStatus === 'COMPLETED') {
      const completedOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { riderId: true, totalKobo: true },
      });

      const riderId = completedOrder?.riderId;
      if (riderId) {
        // Prefer the commission recorded at assignment; fall back to the
        // standard 20% calculation if the row is missing (e.g. an order
        // assigned outside assignRiderToPaidOrder).
        const commission = await tx.commission.findUnique({
          where: { orderId_riderId: { orderId, riderId } },
          select: { amountKobo: true },
        });
        const commissionKobo =
          commission?.amountKobo ??
          calculatePercentageKobo(completedOrder?.totalKobo ?? 0, 20);

        if (!commission) {
          await tx.commission.create({
            data: {
              orderId,
              riderId,
              amountKobo: commissionKobo,
              amount: koboToNaira(commissionKobo),
              status: 'PENDING',
            },
          });
        }

        await tx.rider.update({
          where: { id: riderId },
          data: {
            walletBalanceKobo: { increment: commissionKobo },
            walletBalance: { increment: koboToNaira(commissionKobo) },
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'RIDER_WALLET_CREDITED',
            entityType: 'RIDER',
            entityId: riderId,
            userId: actorUserId,
            changes: JSON.stringify({ orderId, commissionKobo }),
          },
        });
      }
    }

    return tx.order.findUnique({ where: { id: orderId } });
  });
}
