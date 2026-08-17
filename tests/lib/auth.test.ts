import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../../src/lib/auth';

describe('JWT authentication', () => {
  it('signs and verifies a valid application session', async () => {
    const token = await signToken({
      userId: 'user-1',
      email: 'customer@example.com',
      role: 'CUSTOMER',
    });

    await expect(verifyToken(token)).resolves.toMatchObject({
      userId: 'user-1',
      role: 'CUSTOMER',
    });
  });

  it('rejects tokens with a syntactically valid signature but invalid role claim', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      userId: 'user-1',
      email: 'customer@example.com',
      role: 'OWNER',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);

    await expect(verifyToken(token)).resolves.toBeNull();
  });
});
