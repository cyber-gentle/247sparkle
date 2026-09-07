import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { koboToNaira } from '@/lib/money';

const processWithdrawalSchema = z.object({
  action: z.enum(['MARK_PAID', 'REJECT']),
});

/**
 * PUT /api/admin/withdrawals/[id] - Process a withdrawal request (admin only).
 *
 * MARK_PAID: called after the bank transfer has been sent. Atomically flips the
 * request PENDING → PAID and settles the rider's PENDING commissions covered by
 * the withdrawn amount (oldest first). The guarded updateMany means a replayed
 * or racing request can never double-settle.
 *
 * REJECT: refunds the amount to the rider's wallet (the request deducted it at
 * creation time) and marks the request REJECTED.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimitRequest(request, 'admin-mutation', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = processWithdrawalSchema.parse(body);

    if (action === 'MARK_PAID') {
      const result = await prisma.$transaction(async (tx) => {
        // Guard: only a still-PENDING request can transition to PAID.
        const settled = await tx.withdrawalRequest.updateMany({
          where: { id, status: 'PENDING' },
          data: { status: 'PAID', processedAt: new Date() },
        });

        if (settled.count !== 1) {
          return null;
        }

        const withdrawal = await tx.withdrawalRequest.findUnique({
          where: { id },
          select: { riderId: true, amountKobo: true },
        });
        if (!withdrawal) {
          throw new Error('Withdrawal request could not be loaded after settlement');
        }

        // Settle the rider's pending commissions covered by this withdrawal,
        // oldest first. Amounts may not line up exactly (commissions are
        // per-order while withdrawals are arbitrary amounts), so we mark
        // whole commissions PAID up to the withdrawn amount; a final partial
        // commission stays PENDING for the next withdrawal.
        const pendingCommissions = await tx.commission.findMany({
          where: { riderId: withdrawal.riderId, status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          select: { id: true, amountKobo: true },
        });

        let remaining = withdrawal.amountKobo;
        const settledCommissionIds: string[] = [];
        for (const commission of pendingCommissions) {
          if (commission.amountKobo <= remaining) {
            settledCommissionIds.push(commission.id);
            remaining -= commission.amountKobo;
          } else {
            break; // oldest-first: once one doesn't fit, later ones won't either
          }
        }

        if (settledCommissionIds.length > 0) {
          await tx.commission.updateMany({
            where: { id: { in: settledCommissionIds } },
            data: { status: 'PAID' },
          });
        }

        await tx.auditLog.create({
          data: {
            action: 'WITHDRAWAL_MARKED_PAID',
            entityType: 'WITHDRAWAL_REQUEST',
            entityId: id,
            userId: auth.session.userId,
            changes: JSON.stringify({
              riderId: withdrawal.riderId,
              amountKobo: withdrawal.amountKobo,
              commissionsSettled: settledCommissionIds.length,
              unsettledKobo: remaining,
            }),
          },
        });

        return tx.withdrawalRequest.findUnique({
          where: { id },
          include: {
            rider: {
              select: {
                user: { select: { fullName: true, email: true, phone: true } },
              },
            },
          },
        });
      });

      if (!result) {
        return NextResponse.json(
          { error: 'Withdrawal request is not pending (already processed or not found)' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { message: 'Withdrawal marked as paid', withdrawal: result },
        { status: 200 }
      );
    }

    // REJECT — refund the rider's wallet and mark the request REJECTED.
    const result = await prisma.$transaction(async (tx) => {
      const rejected = await tx.withdrawalRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'REJECTED', processedAt: new Date() },
      });

      if (rejected.count !== 1) {
        return null;
      }

      const withdrawal = await tx.withdrawalRequest.findUnique({
        where: { id },
        select: { riderId: true, amountKobo: true },
      });
      if (!withdrawal) {
        throw new Error('Withdrawal request could not be loaded after rejection');
      }

      // The request deducted the amount from the wallet at creation time —
      // put it back.
      await tx.rider.update({
        where: { id: withdrawal.riderId },
        data: {
          walletBalanceKobo: { increment: withdrawal.amountKobo },
          walletBalance: { increment: koboToNaira(withdrawal.amountKobo) },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'WITHDRAWAL_REJECTED',
          entityType: 'WITHDRAWAL_REQUEST',
          entityId: id,
          userId: auth.session.userId,
          changes: JSON.stringify({
            riderId: withdrawal.riderId,
            refundedKobo: withdrawal.amountKobo,
          }),
        },
      });

      return tx.withdrawalRequest.findUnique({
        where: { id },
        include: {
          rider: {
            select: {
              user: { select: { fullName: true, email: true, phone: true } },
            },
          },
        },
      });
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Withdrawal request is not pending (already processed or not found)' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Withdrawal rejected and amount refunded to the rider wallet', withdrawal: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Process withdrawal error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
