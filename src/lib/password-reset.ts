import { createHash, randomBytes } from 'crypto';
import prisma from '@/lib/db';

export const PASSWORD_RESET_TTL_MINUTES = 30;
export const RESET_TOKEN_BYTES = 32;

/**
 * Only the SHA-256 hash of a reset token is ever persisted, so a leaked
 * database cannot be used to reset user passwords.
 */
export function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function generateResetToken(): string {
  return randomBytes(RESET_TOKEN_BYTES).toString('hex');
}

export function getPasswordResetExpiry(now = Date.now()): Date {
  return new Date(now + PASSWORD_RESET_TTL_MINUTES * 60_000);
}

/**
 * Issues a fresh token and invalidates any earlier unused tokens for the same
 * user, so only the most recently emailed link can be redeemed.
 */
export async function createPasswordResetToken(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = getPasswordResetExpiry();

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  return { token, expiresAt };
}

export type ConsumeResetTokenResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'INVALID' | 'EXPIRED' | 'USED' };

/**
 * Atomically consumes a token. The conditional update means two concurrent
 * submissions of the same link can never both succeed.
 */
export async function consumePasswordResetToken(
  rawToken: string
): Promise<ConsumeResetTokenResult> {
  const tokenHash = hashResetToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record) return { ok: false, reason: 'INVALID' };
  if (record.usedAt) return { ok: false, reason: 'USED' };
  if (record.expiresAt.getTime() <= Date.now()) return { ok: false, reason: 'EXPIRED' };

  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (claimed.count === 0) return { ok: false, reason: 'USED' };

  return { ok: true, userId: record.userId };
}
