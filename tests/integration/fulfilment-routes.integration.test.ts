import { describe, expect, it } from 'vitest';
import prisma from '@/lib/db';
import {
  authenticatedJsonRequest,
  createCustomer,
  createPaidUnassignedOrder,
  createRider,
} from './helpers';
import { POST as acceptJob } from '@/app/api/riders/jobs/[id]/accept/route';
import { POST as updateOrderStatus } from '@/app/api/orders/[id]/status/route';

describe('database-backed rider fulfilment routes', () => {
  it('enforces rider approval and job-id matching before atomically accepting a job', async () => {
    const { customer } = await createCustomer();
    const order = await createPaidUnassignedOrder(customer.id);
    const unapproved = await createRider({ approvalStatus: 'PENDING' });
    const approved = await createRider();

    const denied = await acceptJob(
      await authenticatedJsonRequest(
        `/api/riders/jobs/${order.id}/accept`,
        { userId: unapproved.user.id, email: unapproved.user.email, role: 'RIDER' },
        { orderId: order.id }
      ),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(denied.status).toBe(403);

    const mismatch = await acceptJob(
      await authenticatedJsonRequest(
        `/api/riders/jobs/${order.id}/accept`,
        { userId: approved.user.id, email: approved.user.email, role: 'RIDER' },
        { orderId: 'different-order-id' }
      ),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(mismatch.status).toBe(400);

    const accepted = await acceptJob(
      await authenticatedJsonRequest(
        `/api/riders/jobs/${order.id}/accept`,
        { userId: approved.user.id, email: approved.user.email, role: 'RIDER' },
        { orderId: order.id }
      ),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(accepted.status).toBe(200);

    const duplicate = await acceptJob(
      await authenticatedJsonRequest(
        `/api/riders/jobs/${order.id}/accept`,
        { userId: approved.user.id, email: approved.user.email, role: 'RIDER' },
        { orderId: order.id }
      ),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(duplicate.status).toBe(409);
    expect(await prisma.order.findUnique({ where: { id: order.id } })).toMatchObject({
      riderId: approved.rider.id,
      status: 'RIDER_ASSIGNED',
    });
  });

  it('allows an assigned rider through valid transitions, blocks other riders, and permits an admin override', async () => {
    const { customer } = await createCustomer();
    const order = await createPaidUnassignedOrder(customer.id);
    const assigned = await createRider({ fullName: 'Assigned Rider' });
    const other = await createRider({ fullName: 'Other Rider' });
    await prisma.order.update({
      where: { id: order.id },
      data: { riderId: assigned.rider.id, status: 'RIDER_ASSIGNED' },
    });

    const pickedUp = await updateOrderStatus(
      await authenticatedJsonRequest(
        `/api/orders/${order.id}/status`,
        { userId: assigned.user.id, email: assigned.user.email, role: 'RIDER' },
        { status: 'PICKED_UP' }
      ),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(pickedUp.status).toBe(200);

    const forbidden = await updateOrderStatus(
      await authenticatedJsonRequest(
        `/api/orders/${order.id}/status`,
        { userId: other.user.id, email: other.user.email, role: 'RIDER' },
        { status: 'IN_CLEANING' }
      ),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(forbidden.status).toBe(403);

    const invalid = await updateOrderStatus(
      await authenticatedJsonRequest(
        `/api/orders/${order.id}/status`,
        { userId: assigned.user.id, email: assigned.user.email, role: 'RIDER' },
        { status: 'COMPLETED' }
      ),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(invalid.status).toBe(409);

    const admin = await prisma.user.create({
      data: {
        fullName: 'Integration Admin',
        email: 'admin@example.test',
        passwordHash: 'not-used-by-this-fixture',
        role: 'ADMIN',
      },
    });
    const updatedByAdmin = await updateOrderStatus(
      await authenticatedJsonRequest(
        `/api/orders/${order.id}/status`,
        { userId: admin.id, email: admin.email, role: 'ADMIN' },
        { status: 'IN_CLEANING' }
      ),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(updatedByAdmin.status).toBe(200);
    expect(await prisma.order.findUnique({ where: { id: order.id } })).toMatchObject({
      status: 'IN_CLEANING',
    });
  });
});
