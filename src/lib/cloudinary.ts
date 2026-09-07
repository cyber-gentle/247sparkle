import { v2 as cloudinary } from 'cloudinary';

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return Boolean(cloudName && apiKey && apiSecret);
}

export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return cloudinary;
  }
  return null;
}

export interface UploadOptions {
  folder?: string;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
  simulated?: boolean;
}

/**
 * Upload an image buffer to Cloudinary, with a simulated fallback if credentials
 * are not configured (useful for local development, demo environments, and tests).
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const cld = getCloudinary();

  if (!cld) {
    // Development / fallback mode: encode as a data URI
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    return {
      url: dataUrl,
      publicId: `simulated_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      simulated: true,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder: options.folder || '247sparkle/onboarding',
        resource_type: 'image',
        transformation: [
          {
            width: options.width || 400,
            height: options.height || 400,
            crop: options.crop || 'fill',
            gravity: options.gravity || 'face',
          },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            simulated: false,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}
