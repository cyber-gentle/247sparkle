import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  quotation: {
    create: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: {
    mutation: {},
  },
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { POST as submitContactMessage } from '@/app/api/contact/route';

describe('POST /api/contact — Public Contact Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid or missing JSON body with 400', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    });

    const response = await submitContactMessage(request);
    expect(response.status).toBe(400);
  });

  it('validates email format and required fields', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: 'not-an-email',
        phone: '123',
        message: 'short',
      }),
    });

    const response = await submitContactMessage(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('successfully creates contact inquiry and returns 201', async () => {
    db.quotation.create.mockResolvedValue({
      id: 'quote-inquiry-1',
      serviceType: 'general_inquiry',
      contactName: 'Ngozi Eze',
      email: 'ngozi@example.com',
      phone: '08099887766',
      message: 'Hello, I would like to inquire about office cleaning services in Otukpo.',
      status: 'new',
    });
    db.auditLog.create.mockResolvedValue({ id: 'audit-1' });

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ngozi Eze',
        email: 'ngozi@example.com',
        phone: '08099887766',
        message: 'Hello, I would like to inquire about office cleaning services in Otukpo.',
      }),
    });

    const response = await submitContactMessage(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.id).toBe('quote-inquiry-1');

    expect(db.quotation.create).toHaveBeenCalledWith({
      data: {
        serviceType: 'general_inquiry',
        contactName: 'Ngozi Eze',
        email: 'ngozi@example.com',
        phone: '08099887766',
        message: 'Hello, I would like to inquire about office cleaning services in Otukpo.',
        status: 'new',
      },
    });

    expect(db.auditLog.create).toHaveBeenCalled();
  });
});
