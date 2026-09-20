import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  quotation: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const authLib = vi.hoisted(() => ({
  requireRole: vi.fn(),
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: { quotationSubmission: {}, mutation: {} },
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-auth', () => ({ requireRole: authLib.requireRole }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { GET as listQuotations, POST as submitQuotation } from '@/app/api/quotations/route';
import { PUT as updateQuotation } from '@/app/api/quotations/[id]/route';

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost:4028${url}`, {
    method,
    ...(body !== undefined
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  });
}

const VALID_SUBMISSION = {
  serviceType: 'office_cleaning',
  contactName: 'Adaeze Okonkwo',
  address: '12 Ochacho Avenue, Otukpo, Benue State',
  phone: '09039661885',
  email: 'adaeze@example.com',
  message: 'We need weekly office cleaning for a two-floor suite.',
};

describe('public quotation submission (POST /api/quotations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitLib.rateLimitRequest.mockResolvedValue(null);
  });

  it('stores a valid submission', async () => {
    db.quotation.create.mockResolvedValue({ id: 'q1' });

    const response = await submitQuotation(
      jsonRequest('/api/quotations', 'POST', VALID_SUBMISSION)
    );

    expect(response.status).toBe(201);
    expect(db.quotation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...VALID_SUBMISSION, businessName: null, status: 'NEW' }),
    });
  });

  it('rate-limits before validation or any database write', async () => {
    rateLimitLib.rateLimitRequest.mockResolvedValue(
      new NextResponse(JSON.stringify({ error: 'Too many requests' }), { status: 429 })
    );

    const response = await submitQuotation(
      jsonRequest('/api/quotations', 'POST', VALID_SUBMISSION)
    );

    expect(response.status).toBe(429);
    expect(rateLimitLib.rateLimitRequest).toHaveBeenCalledWith(
      expect.anything(),
      'quotation-submission',
      rateLimitLib.RATE_LIMIT_POLICIES.quotationSubmission
    );
    expect(db.quotation.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid email, oversized payload, or unknown serviceType without persisting', async () => {
    for (const bad of [
      { ...VALID_SUBMISSION, email: 'not-an-email' },
      { ...VALID_SUBMISSION, message: 'x'.repeat(2001) },
      { ...VALID_SUBMISSION, serviceType: 'car_wash' },
      { ...VALID_SUBMISSION, contactName: 'x' }, // too short
    ]) {
      const response = await submitQuotation(jsonRequest('/api/quotations', 'POST', bad));
      expect(response.status).toBe(400);
    }
    expect(db.quotation.create).not.toHaveBeenCalled();
  });

  it('rejects a non-string type instead of coercing it', async () => {
    const response = await submitQuotation(
      jsonRequest('/api/quotations', 'POST', { ...VALID_SUBMISSION, phone: { $gt: '' } })
    );

    expect(response.status).toBe(400);
    expect(db.quotation.create).not.toHaveBeenCalled();
  });
});

describe('admin quotation handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authLib.requireRole.mockResolvedValue({
      ok: true,
      session: { userId: 'admin-1', role: 'ADMIN' },
    });
  });

  it('authorizes the listing through requireRole, not a spoofable header', async () => {
    db.quotation.findMany.mockResolvedValue([]);

    const response = await listQuotations(jsonRequest('/api/quotations', 'GET'));

    expect(response.status).toBe(200);
    expect(authLib.requireRole).toHaveBeenCalledWith(expect.anything(), ['ADMIN']);
  });

  it('rejects a non-admin session for listing and updates', async () => {
    authLib.requireRole.mockResolvedValue({
      ok: false,
      response: new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    });

    const list = await listQuotations(jsonRequest('/api/quotations', 'GET'));
    const update = await updateQuotation(
      jsonRequest('/api/quotations/q1', 'PUT', { status: 'responded' }),
      {
        params: Promise.resolve({ id: 'q1' }),
      }
    );

    expect(list.status).toBe(403);
    expect(update.status).toBe(403);
    expect(db.quotation.findMany).not.toHaveBeenCalled();
    expect(db.quotation.update).not.toHaveBeenCalled();
  });

  it('updates the status and stamps respondedAt for non-new statuses', async () => {
    db.quotation.update.mockResolvedValue({ id: 'q1', status: 'responded' });

    const response = await updateQuotation(
      jsonRequest('/api/quotations/q1', 'PUT', { status: 'responded' }),
      { params: Promise.resolve({ id: 'q1' }) }
    );

    expect(response.status).toBe(200);
    expect(db.quotation.update).toHaveBeenCalledWith({
      where: { id: 'q1' },
      data: expect.objectContaining({ status: 'responded', respondedAt: expect.any(Date) }),
    });
  });

  it('rejects an unknown status without touching the database', async () => {
    const response = await updateQuotation(
      jsonRequest('/api/quotations/q1', 'PUT', { status: 'deleted' }),
      { params: Promise.resolve({ id: 'q1' }) }
    );

    expect(response.status).toBe(400);
    expect(db.quotation.update).not.toHaveBeenCalled();
  });

  it('404s an unknown quotation id', async () => {
    db.quotation.update.mockRejectedValue(Object.assign(new Error('not found'), { code: 'P2025' }));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await updateQuotation(
      jsonRequest('/api/quotations/missing', 'PUT', { status: 'responded' }),
      { params: Promise.resolve({ id: 'missing' }) }
    );

    expect(response.status).toBe(404);
  });
});
