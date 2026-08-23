import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { signToken, type JWTPayload } from '@/lib/auth';

let requestNumber = 0;

function nextTestIp() {
  requestNumber += 1;
  return `198.51.100.${(requestNumber % 200) + 1}`;
}

export async function authenticatedJsonRequest(
  pathname: string,
  payload: JWTPayload,
  body?: unknown,
  method = 'POST'
) {
  const token = await signToken(payload);
  const headers = new Headers({
    cookie: `auth_token=${token}`,
    'x-forwarded-for': nextTestIp(),
  });

  if (body !== undefined) headers.set('content-type', 'application/json');

  return new NextRequest(`http://localhost:4028${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function jsonRequest(pathname: string, body: unknown, method = 'POST') {
  return new NextRequest(`http://localhost:4028${pathname}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': nextTestIp(),
    },
    body: JSON.stringify(body),
  });
}

export async function createCustomer(overrides: Partial<{ fullName: string; email: string }> = {}) {
  const unique = crypto.randomUUID();
  const user = await prisma.user.create({
    data: {
      fullName: overrides.fullName ?? 'Integration Customer',
      email: overrides.email ?? `customer-${unique}@example.test`,
      passwordHash: 'not-used-by-this-fixture',
      role: 'CUSTOMER',
    },
  });
  const customer = await prisma.customer.create({ data: { userId: user.id } });
  return { user, customer };
}

export async function createRider(
  overrides: Partial<{ approvalStatus: string; availabilityStatus: string; fullName: string }> = {}
) {
  const unique = crypto.randomUUID();
  const user = await prisma.user.create({
    data: {
      fullName: overrides.fullName ?? 'Integration Rider',
      email: `rider-${unique}@example.test`,
      passwordHash: 'not-used-by-this-fixture',
      role: 'RIDER',
    },
  });
  const rider = await prisma.rider.create({
    data: {
      userId: user.id,
      approvalStatus: overrides.approvalStatus ?? 'APPROVED',
      availabilityStatus: overrides.availabilityStatus ?? 'WORKING',
    },
  });
  return { user, rider };
}

export async function createPaidUnassignedOrder(customerId: string, totalKobo = 125_075) {
  return prisma.order.create({
    data: {
      customerId,
      serviceType: 'LAUNDRY',
      status: 'PAID_UNASSIGNED',
      paymentStatus: 'PAID',
      totalAmount: totalKobo / 100,
      totalKobo,
      pickupAddress: '12 Test Street',
      deliveryAddress: '13 Test Street',
    },
  });
}
