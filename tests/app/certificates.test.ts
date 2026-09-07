import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
  },
  customer: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  certificate: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
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
  RATE_LIMIT_POLICIES: {
    mutation: {},
  },
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-auth', () => ({ requireRole: authLib.requireRole }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { GET as getCustomerCertificates } from '@/app/api/certificates/customer/[userId]/route';
import { GET as getAllCertificates, POST as issueCertificate } from '@/app/api/certificates/route';
import { GET as downloadCertificate } from '@/app/api/certificates/[id]/download/route';

describe('Fumigation Certificate Lifecycle APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/certificates/customer/[userId]', () => {
    it('returns 401 when unauthenticated and no user headers present', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: false,
        response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
      });

      const request = new NextRequest('http://localhost/api/certificates/customer/me');
      const response = await getCustomerCertificates(request, {
        params: Promise.resolve({ userId: 'me' }),
      });

      expect(response.status).toBe(401);
    });

    it('returns 404 when customer record does not exist', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: true,
        session: { userId: 'user-unknown', role: 'CUSTOMER' },
      });
      db.customer.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/certificates/customer/me');
      const response = await getCustomerCertificates(request, {
        params: Promise.resolve({ userId: 'me' }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Customer not found');
    });

    it('returns customer certificates successfully', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: true,
        session: { userId: 'user-1', role: 'CUSTOMER' },
      });
      db.customer.findUnique.mockResolvedValue({ id: 'cust-1', userId: 'user-1' });

      const testDate = new Date('2026-04-24T10:00:00.000Z');
      db.certificate.findMany.mockResolvedValue([
        {
          id: 'cert-1',
          orderId: 'order-1',
          certificateNumber: 'SPKFUM-2026-00001',
          customerName: 'Adaeze Okonkwo',
          propertyAddress: '12 Ochacho Avenue',
          propertyType: '2 Rooms Apartment',
          serviceDate: testDate,
          issuedAt: testDate,
        },
      ]);

      const request = new NextRequest('http://localhost/api/certificates/customer/me');
      const response = await getCustomerCertificates(request, {
        params: Promise.resolve({ userId: 'me' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.certificates).toHaveLength(1);
      expect(data.certificates[0]).toMatchObject({
        certificateNumber: 'SPKFUM-2026-00001',
        customerName: 'Adaeze Okonkwo',
        propertyType: '2 Rooms Apartment',
        serviceDate: testDate.toISOString(),
      });
    });
  });

  describe('POST /api/certificates — Admin issuing', () => {
    it('blocks non-admin users with 403', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: false,
        response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
      });

      const request = new NextRequest('http://localhost/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1' }),
      });

      const response = await issueCertificate(request);
      expect(response.status).toBe(403);
    });

    it('returns 404 if order does not exist', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: true,
        session: { userId: 'admin-1', role: 'ADMIN' },
      });
      db.order.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'non-existent' }),
      });

      const response = await issueCertificate(request);
      expect(response.status).toBe(404);
      expect((await response.json()).error).toBe('Order not found');
    });

    it('returns 400 if order is not a FUMIGATION order', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: true,
        session: { userId: 'admin-1', role: 'ADMIN' },
      });
      db.order.findUnique.mockResolvedValue({
        id: 'order-1',
        serviceType: 'LAUNDRY',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        customer: { user: { fullName: 'Test User' } },
        certificate: null,
      });

      const request = new NextRequest('http://localhost/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1' }),
      });

      const response = await issueCertificate(request);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe(
        'Certificates can only be issued for fumigation orders'
      );
    });

    it('returns 400 if order is not completed or not paid', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: true,
        session: { userId: 'admin-1', role: 'ADMIN' },
      });
      db.order.findUnique.mockResolvedValue({
        id: 'order-1',
        serviceType: 'FUMIGATION',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        customer: { user: { fullName: 'Test User' } },
        certificate: null,
      });

      const request = new NextRequest('http://localhost/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1' }),
      });

      const response = await issueCertificate(request);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe(
        'Certificates can only be issued for completed orders'
      );
    });

    it('returns 409 if certificate was already issued for the order', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: true,
        session: { userId: 'admin-1', role: 'ADMIN' },
      });
      db.order.findUnique.mockResolvedValue({
        id: 'order-1',
        serviceType: 'FUMIGATION',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        customer: { user: { fullName: 'Test User' } },
        certificate: { certificateNumber: 'SPKFUM-2026-00001' },
      });

      const request = new NextRequest('http://localhost/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1' }),
      });

      const response = await issueCertificate(request);
      expect(response.status).toBe(409);
      expect((await response.json()).error).toBe(
        'Certificate has already been issued for this order'
      );
    });

    it('successfully issues a certificate with auto-generated sequential number', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: true,
        session: { userId: 'admin-1', role: 'ADMIN' },
      });

      const scheduledDate = new Date('2026-09-10');
      db.order.findUnique.mockResolvedValue({
        id: 'order-fum-1',
        customerId: 'cust-1',
        serviceType: 'FUMIGATION',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        deliveryAddress: '15 High Street, Lagos',
        pickupAddress: '15 High Street, Lagos',
        scheduledDate,
        createdAt: scheduledDate,
        customer: {
          user: {
            fullName: 'Chidi Mokeme',
            email: 'chidi@example.com',
            phone: '08012345678',
          },
        },
        items: [{ itemName: '3 Rooms Apartment' }],
        certificate: null,
      });

      const currentYear = new Date().getFullYear();
      db.certificate.findFirst.mockResolvedValue({
        certificateNumber: `SPKFUM-${currentYear}-00007`,
      });

      const createdCertDate = new Date();
      db.certificate.create.mockImplementation(async ({ data }: any) => ({
        id: 'cert-new-1',
        ...data,
        issuedAt: createdCertDate,
      }));

      db.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const request = new NextRequest('http://localhost/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-fum-1' }),
      });

      const response = await issueCertificate(request);
      expect(response.status).toBe(201);

      const result = await response.json();
      expect(result.message).toBe('Certificate issued successfully');
      expect(result.certificate.certificateNumber).toBe(`SPKFUM-${currentYear}-00008`);
      expect(result.certificate.customerName).toBe('Chidi Mokeme');
      expect(result.certificate.propertyType).toBe('3 Rooms Apartment');
      expect(result.certificate.propertyAddress).toBe('15 High Street, Lagos');

      expect(db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ISSUE_CERTIFICATE',
            entityType: 'CERTIFICATE',
            userId: 'admin-1',
          }),
        })
      );
    });
  });

  describe('GET /api/certificates — Admin listing', () => {
    it('returns all issued certificates for admin', async () => {
      authLib.requireRole.mockResolvedValue({
        ok: true,
        session: { userId: 'admin-1', role: 'ADMIN' },
      });

      const now = new Date();
      db.certificate.findMany.mockResolvedValue([
        {
          id: 'cert-1',
          certificateNumber: 'SPKFUM-2026-00001',
          customerName: 'Adaeze Okonkwo',
          propertyAddress: '12 Ochacho Avenue',
          propertyType: '2 Rooms Apartment',
          serviceDate: now,
          issuedAt: now,
          orderId: 'order-1',
          customer: {
            user: {
              fullName: 'Adaeze Okonkwo',
              email: 'adaeze@example.com',
              phone: '09012345678',
            },
          },
          order: {
            id: 'order-1',
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            createdAt: now,
          },
        },
      ]);

      const request = new NextRequest('http://localhost/api/certificates');
      const response = await getAllCertificates(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.certificates).toHaveLength(1);
      expect(data.certificates[0].certificateNumber).toBe('SPKFUM-2026-00001');
      expect(data.certificates[0].customerEmail).toBe('adaeze@example.com');
    });
  });

  describe('GET /api/certificates/[id]/download — PDF streaming', () => {
    it('returns 404 if certificate is not found', async () => {
      db.certificate.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/certificates/not-found/download');
      const response = await downloadCertificate(request, {
        params: Promise.resolve({ id: 'not-found' }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Certificate not found');
    });

    it('streams PDF buffer with appropriate headers when certificate exists', async () => {
      const now = new Date();
      db.certificate.findFirst.mockResolvedValue({
        id: 'cert-1',
        certificateNumber: 'SPKFUM-2026-00001',
        customerName: 'Adaeze Okonkwo',
        propertyAddress: '12 Ochacho Avenue, Otukpo, Benue State',
        propertyType: '2 Rooms Apartment',
        serviceDate: now,
        issuedAt: now,
      });

      const request = new NextRequest(
        'http://localhost/api/certificates/SPKFUM-2026-00001/download'
      );
      const response = await downloadCertificate(request, {
        params: Promise.resolve({ id: 'SPKFUM-2026-00001' }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
      expect(response.headers.get('content-disposition')).toContain(
        '247Sparkle-Certificate-SPKFUM-2026-00001.pdf'
      );

      const arrayBuffer = await response.arrayBuffer();
      expect(arrayBuffer.byteLength).toBeGreaterThan(100);
    });
  });
});
