import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { calculatePercentageKobo, koboToNaira } from '@/lib/money';
import { assertOrderTransition, type OrderStatus } from '@/lib/order-state';

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
    const transition = await tx.order.updateMany({
      where: {
        id: orderId,
        status: currentStatus,
        paymentStatus: 'PAID',
        riderId: { not: null },
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

    return tx.order.findUnique({ where: { id: orderId } });
  });
}
