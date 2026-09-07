import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: {
    mutation: {},
  },
}));

vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { POST } from '@/app/api/upload/route';

describe('POST /api/upload', () => {
  it('returns 400 when no file is uploaded', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost:4028/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/no image file/i);
  });

  it('returns 400 when file format is not an image', async () => {
    const formData = new FormData();
    const fakeFile = new File(['hello world'], 'notes.txt', { type: 'text/plain' });
    formData.append('file', fakeFile);

    const req = new NextRequest('http://localhost:4028/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid file format/i);
  });

  it('returns 400 when file exceeds 5MB', async () => {
    const formData = new FormData();
    // 6MB buffer
    const largeContent = new Uint8Array(6 * 1024 * 1024);
    const largeFile = new File([largeContent], 'huge.jpg', { type: 'image/jpeg' });
    formData.append('file', largeFile);

    const req = new NextRequest('http://localhost:4028/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/too large/i);
  });

  it('successfully uploads valid image and returns URL', async () => {
    const formData = new FormData();
    const validImageContent = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const file = new File([validImageContent], 'passport.jpg', { type: 'image/jpeg' });
    formData.append('file', file);
    formData.append('folder', '247sparkle/riders');

    const req = new NextRequest('http://localhost:4028/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.url).toBe('string');
    expect(data.url.length).toBeGreaterThan(0);
    expect(typeof data.publicId).toBe('string');
  });
});
