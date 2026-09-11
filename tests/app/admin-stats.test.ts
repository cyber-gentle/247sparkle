import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  order: {
    count: vi.fn(),
    aggregate: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  rider: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  partner: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  quotation: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: db }));

import { GET as getAdminStats } from '@/app/api/admin/stats/route';

// Fixed "today" so the 14-day window is deterministic.
const NOW = new Date('2026-09-07T10:00:00Z');
vi.setSystemTime(NOW);

function stubCounts() {
  db.order.count.mockResolvedValue(0);
  db.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 0 } });
  db.order.groupBy.mockResolvedValue([]);
  db.rider.count.mockResolvedValue(0);
  db.partner.count.mockResolvedValue(0);
  db.order.findMany.mockResolvedValue([]);
  db.rider.findMany.mockResolvedValue([]);
  db.partner.findMany.mockResolvedValue([]);
  db.quotation.findMany.mockResolvedValue([]);
}

describe('GET /api/admin/stats revenue series and service distribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubCounts();
  });

  it('returns 403 for a non-admin caller', async () => {
    const request = new NextRequest('http://localhost/api/admin/stats', {
      headers: { 'x-user-role': 'CUSTOMER' },
    });
    const response = await getAdminStats(request);
    expect(response.status).toBe(403);
  });

  it('buckets the 14-day window into zero-filled daily entries', async () => {
    // Two orders: one PAID yesterday, one UNPAID 3 days ago.
    const yesterday = new Date(NOW);
    yesterday.setDate(yesterday.getDate() - 1);
    const threeDaysAgo = new Date(NOW);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // count() is called for ordersToday, totalOrders, and completedOrders —
    // return values by the where-clause so the chain can't be miscounted.
    db.order.count.mockImplementation((args: any) => {
      if (args?.where?.status) return Promise.resolve(2); // completedOrders
      if (args?.where?.createdAt) return Promise.resolve(1); // ordersToday
      return Promise.resolve(2); // totalOrders
    });
    db.order.findMany.mockImplementation((args: any) => {
      if (args?.where?.createdAt?.gte) {
        // The 14-day revenue window query.
        return Promise.resolve([
          { createdAt: yesterday, totalAmount: 1500, paymentStatus: 'PAID' },
          { createdAt: threeDaysAgo, totalAmount: 900, paymentStatus: 'UNPAID' },
        ]);
      }
      return Promise.resolve([]); // recentOrders
    });

    const request = new NextRequest('http://localhost/api/admin/stats', {
      headers: { 'x-user-role': 'ADMIN' },
    });
    const response = await getAdminStats(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revenueSeries).toHaveLength(14);

    // Revenue counts PAID orders only; order counts include all orders.
    const revenueTotal = data.revenueSeries.reduce((s: number, p: any) => s + p.revenue, 0);
    const ordersTotal = data.revenueSeries.reduce((s: number, p: any) => s + p.orders, 0);
    expect(revenueTotal).toBe(1500);
    expect(ordersTotal).toBe(2);

    // Every entry has a day label and numbers (no nulls/undefined).
    for (const point of data.revenueSeries) {
      expect(typeof point.day).toBe('string');
      expect(typeof point.revenue).toBe('number');
      expect(typeof point.orders).toBe('number');
    }
  });

  it('returns the all-time service distribution from groupBy', async () => {
    db.order.count.mockResolvedValue(10);
    db.order.groupBy.mockResolvedValue([
      { serviceType: 'LAUNDRY', _count: { _all: 6 }, _sum: { totalAmount: 12000 } },
      { serviceType: 'HOME_CLEANING', _count: { _all: 4 }, _sum: { totalAmount: 8000 } },
    ]);

    const request = new NextRequest('http://localhost/api/admin/stats', {
      headers: { 'x-user-role': 'ADMIN' },
    });
    const response = await getAdminStats(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.serviceDistribution).toEqual([
      { service: 'LAUNDRY', orders: 6, revenue: 12000 },
      { service: 'HOME CLEANING', orders: 4, revenue: 8000 },
    ]);
  });
});
