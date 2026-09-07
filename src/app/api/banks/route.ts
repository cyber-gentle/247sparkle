import { NextRequest, NextResponse } from 'next/server';
import { getNigerianBanks } from '@/lib/paystack';

// Fallback list of major Nigerian banks in case Paystack API is unreachable or in mock mode
const FALLBACK_BANKS = [
  { id: 1, name: 'Access Bank', code: '044' },
  { id: 2, name: 'Citibank Nigeria', code: '023' },
  { id: 3, name: 'Ecobank Nigeria', code: '050' },
  { id: 4, name: 'Fidelity Bank', code: '070' },
  { id: 5, name: 'First Bank of Nigeria', code: '011' },
  { id: 6, name: 'First City Monument Bank (FCMB)', code: '214' },
  { id: 7, name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { id: 8, name: 'Heritage Bank', code: '030' },
  { id: 9, name: 'Keystone Bank', code: '082' },
  { id: 10, name: 'Kuda Bank', code: '50211' },
  { id: 11, name: 'Moniepoint MFB', code: '50515' },
  { id: 12, name: 'OPay Digital Services', code: '999992' },
  { id: 13, name: 'Palmpay', code: '999991' },
  { id: 14, name: 'Polaris Bank', code: '076' },
  { id: 15, name: 'Stanbic IBTC Bank', code: '221' },
  { id: 16, name: 'Standard Chartered Bank', code: '068' },
  { id: 17, name: 'Sterling Bank', code: '232' },
  { id: 18, name: 'Union Bank of Nigeria', code: '032' },
  { id: 19, name: 'United Bank for Africa (UBA)', code: '033' },
  { id: 20, name: 'Unity Bank', code: '215' },
  { id: 21, name: 'Wema Bank', code: '035' },
  { id: 22, name: 'Zenith Bank', code: '057' },
];

/**
 * GET /api/banks — List Nigerian banks (proxy to Paystack with offline fallback)
 */
export async function GET(request: NextRequest) {
  try {
    const banks = await getNigerianBanks();
    return NextResponse.json({ banks }, { status: 200 });
  } catch (error) {
    // Fallback to static bank list so forms remain operable
    return NextResponse.json({ banks: FALLBACK_BANKS }, { status: 200 });
  }
}
