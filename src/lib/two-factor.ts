import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Secret, TOTP } from 'otpauth';

/**
 * TOTP two-factor authentication for the admin login.
 *
 * Secrets are stored AES-256-GCM encrypted (key derived from JWT_SECRET) since
 * they must be recoverable to verify codes — unlike password-reset tokens, they
 * cannot be hashed — but a raw database leak alone should not be enough to
 * generate valid codes.
 */

const TOTP_ISSUER = '247sparkle';
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;
/** Allow the previous and next 30s window for clock drift. */
const TOTP_WINDOW = 1;

export const TWO_FACTOR_LOCKOUT_THRESHOLD = 5;
export const TWO_FACTOR_LOCKOUT_MINUTES = 15;

function getEncryptionKey(): Buffer {
  return createHash('sha256').update(`${process.env.JWT_SECRET}:two-factor`).digest();
}

/** Encrypt a base32 TOTP secret for storage. Output: iv:tag:ciphertext, base64. */
export function encryptTotpSecret(base32Secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(base32Secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/** Decrypt a secret produced by {@link encryptTotpSecret}. Returns null if it cannot be read. */
export function decryptTotpSecret(stored: string): string | null {
  try {
    const raw = Buffer.from(stored, 'base64');
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** Generate a fresh base32 TOTP secret. */
export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

/** The otpauth:// URI authenticator apps scan (as a QR code). */
export function totpUri(email: string, base32Secret: string): string {
  return new TOTP({
    issuer: TOTP_ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret: Secret.fromBase32(base32Secret),
  }).toString();
}

/**
 * Verify a 6-digit code against a secret. `window: 1` accepts the neighbouring
 * 30-second periods so slight clock drift does not lock the admin out.
 */
export function verifyTotpCode(base32Secret: string, code: string): boolean {
  const normalized = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;

  const totp = new TOTP({
    issuer: TOTP_ISSUER,
    label: 'verification',
    algorithm: 'SHA1',
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret: Secret.fromBase32(base32Secret),
  });

  return totp.validate({ token: normalized, window: TOTP_WINDOW }) !== null;
}
