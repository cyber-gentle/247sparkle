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

function uploadRequest(formData: FormData) {
  return new NextRequest('http://localhost:4028/api/upload', {
    method: 'POST',
    body: formData,
  });
}

// Minimal 16-byte payloads starting with each format's real magic bytes.
const JPEG_BYTES = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x00,
]);
const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);
const WEBP_BYTES = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);

describe('POST /api/upload', () => {
  it('returns 400 when no file is uploaded', async () => {
    const formData = new FormData();
    const req = uploadRequest(formData);

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/no image file/i);
  });

  it('returns 400 when file format is not an image', async () => {
    const formData = new FormData();
    const fakeFile = new File(['hello world'], 'notes.txt', { type: 'text/plain' });
    formData.append('file', fakeFile);

    const res = await POST(uploadRequest(formData));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid file format/i);
  });

  it('returns 400 when file exceeds 5MB', async () => {
    const formData = new FormData();
    // 6MB buffer with JPEG magic bytes so the size check is what fires.
    const largeContent = new Uint8Array(6 * 1024 * 1024);
    largeContent.set([0xff, 0xd8, 0xff, 0xe0]);
    const largeFile = new File([largeContent], 'huge.jpg', { type: 'image/jpeg' });
    formData.append('file', largeFile);

    const res = await POST(uploadRequest(formData));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/too large/i);
  });

  it('returns 400 when the folder is not whitelisted', async () => {
    const formData = new FormData();
    const file = new File([JPEG_BYTES], 'passport.jpg', { type: 'image/jpeg' });
    formData.append('file', file);
    formData.append('folder', 'attacker/arbitrary');

    const res = await POST(uploadRequest(formData));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/invalid upload folder/i);
  });

  it('returns 400 when content is not a real image (MIME spoofing)', async () => {
    const formData = new FormData();
    // Arbitrary binary declared as a JPEG.
    const fakeFile = new File([Uint8Array.from([0xde, 0xad, 0xbe, 0xef].concat(Array(20).fill(0x41)))], 'payload.jpg', {
      type: 'image/jpeg',
    });
    formData.append('file', fakeFile);

    const res = await POST(uploadRequest(formData));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/not a valid/i);
  });

  it.each([
    ['jpeg', JPEG_BYTES, 'passport.jpg', 'image/jpeg'],
    ['png', PNG_BYTES, 'passport.png', 'image/png'],
    ['webp', WEBP_BYTES, 'passport.webp', 'image/webp'],
  ])('successfully uploads a valid %s image and returns URL', async (_, bytes, name, mime) => {
    const formData = new FormData();
    const file = new File([bytes], name, { type: mime });
    formData.append('file', file);
    formData.append('folder', '247sparkle/riders');

    const res = await POST(uploadRequest(formData));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.url).toBe('string');
    expect(data.url.length).toBeGreaterThan(0);
    expect(typeof data.publicId).toBe('string');
  });

  it('defaults to the onboarding folder when none is provided', async () => {
    const formData = new FormData();
    const file = new File([JPEG_BYTES], 'passport.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const res = await POST(uploadRequest(formData));
    expect(res.status).toBe(200);
  });
});
