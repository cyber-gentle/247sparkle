import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  $transaction: vi.fn(),
  withdrawalRequest: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  commission: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  rider: {
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

const authLib = vi.hoisted(() => ({
  requireRole: vi.fn(),
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: { mutation: {} },
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-auth', () => ({ requireRole: authLib.requireRole }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { GET as listWithdrawals } from '@/app/api/admin/withdrawals/route';
import { PUT as processWithdrawal } from '@/app/api/admin/withdrawals/[id]/route';

function adminSession() {
  authLib.requireRole.mockResolvedValue({
    ok: true,
    session: { userId: 'admin-user', email: 'admin@test', role: 'ADMIN' },
  });
}

function jsonRequest(url: string, body?: object) {
  return new NextRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe('Admin withdrawal processing API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminSession();
  });

  describe('PUT /api/admin/withdrawals/[id] MARK_PAID', () => {
    function mockTransaction(overrides: Record<string, unknown> = {}) {
      const tx = {
        withdrawalRequest: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockImplementation((args) => {
            // Inside the transaction: load riderId/amountKobo.
            // Final call: the returned withdrawal with rider include.
            if (args?.select) {
              return Promise.resolve({ riderId: 'rider-1', amountKobo: 25000 });
            }
            return Promise.resolve({ id: 'wd-1', status: 'PAID' });
          }),
        },
        commission: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ id: 'c-1', amountKobo: 15000 }, { id: 'c-2', amountKobo: 10000 }]),
          updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
        },
        ...overrides,
      };
      db.$transaction.mockImplementation(async (callback) => callback(tx));
      return tx;
    }

    it('marks a pending withdrawal paid and settles covered commissions oldest-first', async () => {
      const tx = mockTransaction();

      const response = await processWithdrawal(
        jsonRequest('http://localhost/api/admin/withdrawals/wd-1', { action: 'MARK_PAID' }),
        { params: Promise.resolve({ id: 'wd-1' }) }
      );

      expect(response.status).toBe(200);
      expect(tx.withdrawalRequest.updateMany).toHaveBeenCalledWith({
        where: { id: 'wd-1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'PAID' }),
      });
      // 25000 withdrawn covers commissions of 15000 + 10000 exactly.
      expect(tx.commission.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['c-1', 'c-2'] } },
        data: { status: 'PAID' },
      });
      expect(db.rider.update).not.toHaveBeenCalled();
      expect(tx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'WITHDRAWAL_MARKED_PAID' }),
        })
      );
    });

    it('leaves a partial commission pending when the withdrawal does not cover it', async () => {
      const tx = mockTransaction({
        commission: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ id: 'c-1', amountKobo: 15000 }, { id: 'c-2', amountKobo: 20000 }]),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      });

      const response = await processWithdrawal(
        jsonRequest('http://localhost/api/admin/withdrawals/wd-1', { action: 'MARK_PAID' }),
        { params: Promise.resolve({ id: 'wd-1' }) }
      );

      expect(response.status).toBe(200);
      // 25000 covers c-1 (15000) fully; c-2 (20000) does not fit and stays PENDING.
      expect(tx.commission.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['c-1'] } },
        data: { status: 'PAID' },
      });
    });

    it('returns 409 when the withdrawal was already processed', async () => {
      mockTransaction({
        withdrawalRequest: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          findUnique: vi.fn(),
        },
      });

      const response = await processWithdrawal(
        jsonRequest('http://localhost/api/admin/withdrawals/wd-1', { action: 'MARK_PAID' }),
        { params: Promise.resolve({ id: 'wd-1' }) }
      );

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /api/admin/withdrawals/[id] REJECT', () => {
    it('refunds the rider wallet and marks the request rejected', async () => {
      const tx = {
        withdrawalRequest: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockImplementation((args) => {
            if (args?.select) {
              return Promise.resolve({ riderId: 'rider-1', amountKobo: 25000 });
            }
            return Promise.resolve({ id: 'wd-1', status: 'REJECTED' });
          }),
        },
        rider: {
          update: vi.fn().mockResolvedValue({ id: 'rider-1' }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: 'audit-2' }),
        },
      };
      db.$transaction.mockImplementation(async (callback) => callback(tx));

      const response = await processWithdrawal(
        jsonRequest('http://localhost/api/admin/withdrawals/wd-1', { action: 'REJECT' }),
        { params: Promise.resolve({ id: 'wd-1' }) }
      );

      expect(response.status).toBe(200);
      expect(tx.rider.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rider-1' },
          data: {
            walletBalanceKobo: { increment: 25000 },
            walletBalance: { increment: 250 },
          },
        })
      );
      expect(tx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'WITHDRAWAL_REJECTED' }),
        })
      );
    });
  });

  describe('PUT /api/admin/withdrawals/[id] validation and auth', () => {
    it('returns 403 for a non-admin session', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: false,
        response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
      });

      const response = await processWithdrawal(
        jsonRequest('http://localhost/api/admin/withdrawals/wd-1', { action: 'MARK_PAID' }),
        { params: Promise.resolve({ id: 'wd-1' }) }
      );

      expect(response.status).toBe(403);
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it('rejects an unknown action with 400', async () => {
      const response = await processWithdrawal(
        jsonRequest('http://localhost/api/admin/withdrawals/wd-1', { action: 'DELETE' }),
        { params: Promise.resolve({ id: 'wd-1' }) }
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/withdrawals', () => {
    it('returns withdrawals sorted pending-first', async () => {
      db.withdrawalRequest.findMany.mockResolvedValue([
        { id: 'wd-paid', status: 'PAID', requestedAt: new Date() },
        { id: 'wd-pending', status: 'PENDING', requestedAt: new Date() },
      ]);

      const request = new NextRequest('http://localhost/api/admin/withdrawals');
      const response = await listWithdrawals(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.withdrawals[0].id).toBe('wd-pending');
    });
  });
});
