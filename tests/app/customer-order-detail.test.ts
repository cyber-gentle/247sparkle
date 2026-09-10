import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: db }));

// The route reads identity from the middleware-injected x-user-* headers.
import { GET as getOrderDetails } from '@/app/api/orders/[id]/route';

function customerRequest() {
  return new NextRequest('http://localhost/api/orders/order-1', {
    headers: {
      'x-user-id': 'customer-user',
      'x-user-role': 'CUSTOMER',
    },
  });
}

function routeParams(id = 'order-1') {
  return { params: Promise.resolve({ id }) };
}

function orderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    serviceType: 'LAUNDRY',
    status: 'OUT_FOR_DELIVERY',
    paymentStatus: 'PAID',
    totalAmount: 5000,
    createdAt: new Date('2026-09-08T10:00:00Z'),
    pickupOption: 'HOME_PICKUP',
    pickupAddress: '12 Upu Road, Otukpo',
    deliveryAddress: '45 GRA, Otukpo',
    scheduledDate: null,
    scheduledTime: null,
    items: [],
    customer: {
      userId: 'customer-user',
      user: { fullName: 'Ada Okonkwo', email: 'ada@test', phone: '09012345678' },
    },
    rider: {
      id: 'rider-1',
      userId: 'rider-user',
      availabilityStatus: 'WORKING',
      currentLatitude: 7.2081,
      currentLongitude: 8.1558,
      lastLocationUpdate: new Date('2026-09-08T12:30:00Z'),
      user: { fullName: 'Test Rider', phone: '08034567890' },
    },
    partner: null,
    certificate: null,
    ...overrides,
  };
}

describe('GET /api/orders/[id] (order detail payload)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes the rider live location to the order owner', async () => {
    db.order.findUnique.mockResolvedValue(orderRecord());

    const response = await getOrderDetails(customerRequest(), routeParams());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.rider).toMatchObject({
      id: 'rider-1',
      fullName: 'Test Rider',
      latitude: 7.2081,
      longitude: 8.1558,
    });
    expect(data.order.rider.lastLocationUpdate).toBeTruthy();
  });

  it('omits the map fields gracefully when the rider has no fix yet', async () => {
    db.order.findUnique.mockResolvedValue(
      orderRecord({
        rider: {
          id: 'rider-1',
          userId: 'rider-user',
          availabilityStatus: 'WORKING',
          currentLatitude: null,
          currentLongitude: null,
          lastLocationUpdate: null,
          user: { fullName: 'Test Rider', phone: '08034567890' },
        },
      })
    );

    const response = await getOrderDetails(customerRequest(), routeParams());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.rider).toMatchObject({ latitude: null, longitude: null });
  });

  it('forbids a customer from reading another customer order', async () => {
    db.order.findUnique.mockResolvedValue(orderRecord());

    const request = new NextRequest('http://localhost/api/orders/order-1', {
      headers: {
        'x-user-id': 'someone-else',
        'x-user-role': 'CUSTOMER',
      },
    });

    const response = await getOrderDetails(request, routeParams());

    expect(response.status).toBe(403);
  });

  it('rejects unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost/api/orders/order-1');

    const response = await getOrderDetails(request, routeParams());

    expect(response.status).toBe(401);
  });
});
