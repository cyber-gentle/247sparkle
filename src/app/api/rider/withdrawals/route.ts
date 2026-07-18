import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const withdrawalSchema = z.object({
  amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = withdrawalSchema.parse(body);

    const rider = await prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    // Deduct atomically with a guarded decrement: the WHERE clause re-checks
    // the balance inside the transaction, so two concurrent requests can't
    // both pass a stale balance check and overdraw the wallet.
    const withdrawal = await prisma.$transaction(async (tx) => {
      const deducted = await tx.rider.updateMany({
        where: {
          id: rider.id,
          walletBalance: { gte: validatedData.amount },
        },
        data: {
          walletBalance: { decrement: validatedData.amount },
        },
      });

      if (deducted.count === 0) {
        return null; // insufficient balance
      }

      return tx.withdrawalRequest.create({
        data: {
          riderId: rider.id,
          amount: validatedData.amount,
          status: 'PENDING',
        },
      });
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rider = await prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { riderId: rider.id },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
  }
}
