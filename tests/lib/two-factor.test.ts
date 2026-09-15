import { TOTP, Secret } from 'otpauth';
import { describe, expect, it } from 'vitest';
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  totpUri,
  verifyTotpCode,
} from '../../src/lib/two-factor';

describe('TOTP two-factor helpers', () => {
  it('generates a verifiable secret/code roundtrip', () => {
    const secret = generateTotpSecret();

    const totp = new TOTP({
      issuer: '247sparkle',
      label: 'admin@247sparkle.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    });
    const code = totp.generate();

    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotpCode(secret, code)).toBe(true);
  });

  it('accepts the previous window for clock drift', () => {
    const secret = generateTotpSecret();

    const totp = new TOTP({
      issuer: '247sparkle',
      label: 'admin@247sparkle.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    });
    // Counter of the previous 30-second window.
    const previousWindowCode = totp.generate({ timestamp: Date.now() - 30_000 });

    expect(verifyTotpCode(secret, previousWindowCode)).toBe(true);
  });

  it('rejects a code generated from a different secret', () => {
    const secret = generateTotpSecret();
    const otherSecret = generateTotpSecret();

    const totp = new TOTP({
      issuer: '247sparkle',
      label: 'attacker',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(otherSecret),
    });

    expect(verifyTotpCode(secret, totp.generate())).toBe(false);
  });

  it('rejects malformed codes instead of throwing', () => {
    const secret = generateTotpSecret();

    expect(verifyTotpCode(secret, '')).toBe(false);
    expect(verifyTotpCode(secret, '12ab56')).toBe(false);
    expect(verifyTotpCode(secret, '12345')).toBe(false);
    expect(verifyTotpCode(secret, '1234567')).toBe(false);
  });

  it('builds a scannable otpauth:// URI for the account', () => {
    const secret = generateTotpSecret();
    const uri = totpUri('admin@247sparkle.com', secret);

    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain(encodeURIComponent('admin@247sparkle.com'));
    expect(uri).toContain(`secret=${secret}`);
  });
});

describe('TOTP secret encryption at rest', () => {
  it('encrypts and decrypts back to the original secret', () => {
    const secret = generateTotpSecret();
    const stored = encryptTotpSecret(secret);

    // Stored form must not leak the raw base32 secret.
    expect(stored).not.toContain(secret);
    expect(decryptTotpSecret(stored)).toBe(secret);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const secret = generateTotpSecret();

    expect(encryptTotpSecret(secret)).not.toBe(encryptTotpSecret(secret));
  });

  it('returns null for tampered ciphertext', () => {
    const stored = encryptTotpSecret(generateTotpSecret());
    const tampered = stored.slice(0, -4) + (stored.endsWith('AAAA') ? 'BBBB' : 'AAAA');

    expect(decryptTotpSecret(tampered)).toBeNull();
  });

  it('returns null for non-base64 garbage', () => {
    expect(decryptTotpSecret('not-valid-ciphertext')).toBeNull();
  });
});
