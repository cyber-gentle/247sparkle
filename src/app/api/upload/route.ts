import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';
import { uploadImageBuffer } from '@/lib/cloudinary';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

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
