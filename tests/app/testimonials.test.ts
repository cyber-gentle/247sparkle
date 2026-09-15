import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  testimonial: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const authLib = vi.hoisted(() => ({
  requireRole: vi.fn(),
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: { testimonialSubmission: {}, mutation: {} },
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/api-auth', () => ({ requireRole: authLib.requireRole }));
vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { GET as listPublic, POST as submit } from '@/app/api/testimonials/route';
import { GET as listAdmin } from '@/app/api/admin/testimonials/route';
import { PATCH as moderate, DELETE as remove } from '@/app/api/admin/testimonials/[id]/route';

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost:4028${url}`, {
    method,
    ...(body !== undefined
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  });
}

const VALID_SUBMISSION = {
  name: 'Adaeze Okonkwo',
  location: 'Otukpo, Benue State',
  service: 'LAUNDRY',
  rating: 5,
  quote: 'The pickup rider arrived on time and my clothes came back crisp.',
};

describe('public testimonial endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitLib.rateLimitRequest.mockResolvedValue(null);
  });

  it('lists only approved testimonials for the homepage', async () => {
    db.testimonial.findMany.mockResolvedValue([{ id: 't1', approved: true, quote: 'great' }]);

    const response = await listPublic();

    expect(response.status).toBe(200);
    expect(db.testimonial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { approved: true } })
    );
    const payload = await response.json();
    expect(payload.testimonials).toHaveLength(1);
  });

  it('stores a valid public submission as unapproved', async () => {
    db.testimonial.create.mockResolvedValue({ id: 't1' });

    const response = await submit(jsonRequest('/api/testimonials', 'POST', VALID_SUBMISSION));

    expect(response.status).toBe(201);
    expect(db.testimonial.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...VALID_SUBMISSION, approved: false }),
    });
    const payload = await response.json();
    // No moderation state is echoed to an anonymous submitter.
    expect(payload).toEqual({
      message: 'Thank you! Your testimony has been submitted for review.',
    });
  });

  it('rate-limits submissions before validation', async () => {
    rateLimitLib.rateLimitRequest.mockResolvedValue(
      new NextResponse(JSON.stringify({ error: 'Too many requests' }), { status: 429 })
    );

    const response = await submit(jsonRequest('/api/testimonials', 'POST', VALID_SUBMISSION));

    expect(response.status).toBe(429);
    expect(rateLimitLib.rateLimitRequest).toHaveBeenCalledWith(
      expect.anything(),
      'testimonial-submission',
      rateLimitLib.RATE_LIMIT_POLICIES.testimonialSubmission
    );
    expect(db.testimonial.create).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range rating or unknown service without persisting', async () => {
    for (const bad of [
      { ...VALID_SUBMISSION, rating: 6 },
      { ...VALID_SUBMISSION, service: 'CAR_WASH' },
      { ...VALID_SUBMISSION, quote: 'too short' },
    ]) {
      const response = await submit(jsonRequest('/api/testimonials', 'POST', bad));
      expect(response.status).toBe(400);
    }
    expect(db.testimonial.create).not.toHaveBeenCalled();
  });
});

describe('admin testimonial moderation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authLib.requireRole.mockResolvedValue({
      ok: true,
      session: { userId: 'admin-1', role: 'ADMIN' },
    });
  });

  it('requires an admin session to list all submissions', async () => {
    authLib.requireRole.mockResolvedValue({
      ok: false,
      response: new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    });

    const response = await listAdmin(jsonRequest('/api/admin/testimonials', 'GET'));

    expect(response.status).toBe(403);
    expect(db.testimonial.findMany).not.toHaveBeenCalled();
  });

  it('lists pending before published, newest first', async () => {
    db.testimonial.findMany.mockResolvedValue([]);

    await listAdmin(jsonRequest('/api/admin/testimonials', 'GET'));

    expect(db.testimonial.findMany).toHaveBeenCalledWith({
      orderBy: [{ approved: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('publishes a testimonial via PATCH', async () => {
    db.testimonial.update.mockResolvedValue({ id: 't1', approved: true });

    const response = await moderate(
      jsonRequest('/api/admin/testimonials/t1', 'PATCH', { approved: true }),
      { params: Promise.resolve({ id: 't1' }) }
    );

    expect(response.status).toBe(200);
    expect(db.testimonial.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { approved: true },
    });
  });

  it('404s moderating or deleting an unknown testimonial', async () => {
    const notFound = Object.assign(new Error('not found'), { code: 'P2025' });
    db.testimonial.update.mockRejectedValue(notFound);
    db.testimonial.delete.mockRejectedValue(notFound);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const patch = await moderate(
      jsonRequest('/api/admin/testimonials/missing', 'PATCH', { approved: true }),
      { params: Promise.resolve({ id: 'missing' }) }
    );
    const del = await remove(jsonRequest('/api/admin/testimonials/missing', 'DELETE'), {
      params: Promise.resolve({ id: 'missing' }),
    });

    expect(patch.status).toBe(404);
    expect(del.status).toBe(404);
  });

  it('deletes a submission', async () => {
    db.testimonial.delete.mockResolvedValue({ id: 't1' });

    const response = await remove(jsonRequest('/api/admin/testimonials/t1', 'DELETE'), {
      params: Promise.resolve({ id: 't1' }),
    });

    expect(response.status).toBe(200);
    expect(db.testimonial.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
  });
});
