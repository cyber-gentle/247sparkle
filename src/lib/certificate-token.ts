import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signed download tokens for fumigation certificate PDFs.
 *
 * The download endpoint is intentionally public (customers share links,
 * verification pages deep-link to the PDF), but certificate numbers are
 * sequential and the PDF contains the customer's name and property address.
 * A deterministic HMAC over the certificate number, keyed by JWT_SECRET,
 * makes the URL unguessable without turning the endpoint stateful.
 *
 * Tokens are permanent by design: a certificate is an immutable document
 * and there is no revocation requirement. If JWT_SECRET is rotated, old
 * links stop working — the same property that governs session tokens.
 */

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Fail hard: a missing secret must never silently fall back to a known value.
  throw new Error(
    'JWT_SECRET environment variable is not set. Certificate download tokens cannot be signed securely.'
  );
}

const TOKEN_PURPOSE = 'cert-download';

export function createCertificateDownloadToken(certificateNumber: string): string {
  return createHmac('sha256', JWT_SECRET!)
    .update(`${TOKEN_PURPOSE}:${certificateNumber}`)
    .digest('base64url');
}

export function verifyCertificateDownloadToken(
  certificateNumber: string,
  token: string | null
): boolean {
  if (!token) return false;
  const expected = Buffer.from(createCertificateDownloadToken(certificateNumber));
  let received: Buffer;
  try {
    received = Buffer.from(token);
  } catch {
    return false;
  }
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
