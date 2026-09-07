import { NextRequest, NextResponse } from 'next/server';
import { resolveAccountName } from '@/lib/paystack';
import { RATE_LIMIT_POLICIES, rateLimitRequest } from '@/lib/api-rate-limit';

/**
 * GET /api/banks/resolve — Resolve Nigerian bank account name
 * Query params: accountNumber, bankCode
 */
export async function GET(request: NextRequest) {
  const limited = await rateLimitRequest(request, 'bank-resolve', RATE_LIMIT_POLICIES.mutation);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const accountNumber = searchParams.get('accountNumber')?.trim();
  const bankCode = searchParams.get('bankCode')?.trim();

  if (!accountNumber || !bankCode) {
    return NextResponse.json(
      { error: 'accountNumber and bankCode query parameters are required' },
      { status: 400 }
    );
  }

  try {
    const resolved = await resolveAccountName(accountNumber, bankCode);
    return NextResponse.json({ resolved }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Could not resolve account details' },
      { status: 422 }
    );
  }
}
