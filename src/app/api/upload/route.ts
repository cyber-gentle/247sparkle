import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { uploadImageBuffer } from '@/lib/cloudinary';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

// Uploads happen during rider/partner signup, before an account exists, so
// the endpoint must stay reachable anonymously. Instead we harden it: only
// real images (magic bytes, not just the declared MIME type) and only known
// destination folders, on top of the existing rate limit.
const ALLOWED_FOLDERS = new Set([
  '247sparkle/onboarding',
  '247sparkle/riders',
  '247sparkle/partners',
  '247sparkle/customers',
]);

function hasValidImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  )
    return true;
  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
    return true;
  return false;
}

export async function POST(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'upload', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') as string) || '247sparkle/onboarding';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          error: 'Invalid file format. Only JPEG, PNG, and WebP images are supported.',
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: 'Image file is too large. Maximum allowed size is 5MB.',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // The declared MIME type is client-controlled; verify the actual content
    // so random binaries can't be stored in the image bucket.
    if (!hasValidImageMagicBytes(buffer)) {
      return NextResponse.json(
        { error: 'File content is not a valid JPEG, PNG, or WebP image.' },
        { status: 400 }
      );
    }

    const result = await uploadImageBuffer(buffer, {
      folder,
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face',
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      simulated: result.simulated ?? false,
    });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload photo' }, { status: 500 });
  }
}
