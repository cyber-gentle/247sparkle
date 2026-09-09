import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  rider: {
    findUnique: vi.fn(),
  },
  order: {
    findMany: vi.fn(),
  },
  commission: {
    aggregate: vi.fn(),
  },
}));

const authLib = vi.hoisted(() => ({
  requireRole: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-auth', () => ({ requireRole: authLib.requireRole }));

import { GET as getRiderJobs } from '@/app/api/riders/jobs/route';

const NOW = new Date('2026-09-09T12:00:00Z');

function riderSession() {
  authLib.requireRole.mockResolvedValue({
    ok: true,
    session: { userId: 'rider-user', email: 'rider@test', role: 'RIDER' },
  });
}

function getRequest() {
  return new NextRequest('http://localhost/api/riders/jobs');
}

function riderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rider-1',
    approvalStatus: 'APPROVED',
    availabilityStatus: 'WORKING',
    walletBalance: 4200,
    user: { fullName: 'Test Rider' },
    ...overrides,
  };
}

describe('GET /api/riders/jobs (rider dashboard payload)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(NOW);
    riderSession();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns rider summary, earnings, and both job lists', async () => {
    db.rider.findUnique.mockResolvedValue(riderRecord());
    db.order.findMany.mockImplementation(async (args: { where?: { riderId?: unknown } }) =>
      // First call: available (unassigned) jobs; second: the rider's own.
      args?.where?.riderId === null
        ? [
            {
              id: 'order-available',
              status: 'PAID_UNASSIGNED',
              serviceType: 'LAUNDRY',
              totalAmount: 5000,
              pickupAddress: '12 Upu Road, Otukpo',
              deliveryAddress: '45 GRA, Otukpo',
              scheduledDate: null,
              createdAt: NOW,
              customer: {
                user: { fullName: 'Ada Okonkwo', phone: '09012345678', email: 'ada@test' },
              },
              items: [{ id: 'i1' }, { id: 'i2' }],
            },
          ]
        : [
            {
              id: 'order-mine',
              status: 'OUT_FOR_DELIVERY',
              serviceType: 'LAUNDRY',
              totalAmount: 8000,
              pickupAddress: '12 Upu Road, Otukpo',
              deliveryAddress: '45 GRA, Otukpo',
              scheduledDate: null,
              createdAt: NOW,
              customer: {
                user: { fullName: 'Tunde Afolayan', phone: '08034567890', email: 'tunde@test' },
              },
              items: [{ id: 'i3' }],
            },
          ]
    );
    db.commission.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 2500 } }) // this week
      .mockResolvedValueOnce({ _sum: { amount: 1000 } }); // today

    const response = await getRiderJobs(getRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rider).toMatchObject({
      fullName: 'Test Rider',
      approvalStatus: 'APPROVED',
      availabilityStatus: 'WORKING',
      walletBalance: 4200,
    });
    expect(data.earnings).toEqual({ today: 1000, thisWeek: 2500, allTime: 4200 });
    expect(data.jobs).toHaveLength(1);
    expect(data.jobs[0].orderNumber).toBe('ORD-ORDER-');
    expect(data.assignedJobs).toHaveLength(1);
    expect(data.assignedJobs[0].customer).toEqual({ name: 'Tunde Afolayan', phone: '08034567890' });
  });

  it('only lists unassigned laundry jobs as available', async () => {
    db.rider.findUnique.mockResolvedValue(riderRecord());
    db.order.findMany.mockResolvedValue([]);
    db.commission.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const response = await getRiderJobs(getRequest());

    expect(response.status).toBe(200);
    // The available-jobs query filters to LAUNDRY only: on-site services
    // never enter rider dispatch.
    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          riderId: null,
          serviceType: 'LAUNDRY',
        }),
      })
    );
  });

  it('rejects non-rider sessions', async () => {
    authLib.requireRole.mockResolvedValue({
      ok: false,
      response: new NextResponse('Forbidden', { status: 403 }) as unknown as Response,
    });

    const response = await getRiderJobs(getRequest());

    expect(response.status).toBe(403);
    expect(db.rider.findUnique).not.toHaveBeenCalled();
  });
});
