import axios from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const paystackAPI = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface InitializePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    status: 'success' | 'failed' | 'abandoned';
    customer: {
      id: number;
      email: string;
      phone: string;
    };
  };
}

export interface BankInfo {
  id: number;
  name: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_transfer: boolean;
  active: boolean;
  is_deleted: boolean;
  country_id: number;
}

export interface ResolvedAccount {
  account_number: string;
  account_name: string;
  bank_id: number;
}

/**
 * Initialize a payment with Paystack
 */
export async function initializePayment(
  email: string,
  amountInNaira: number,
  metadata?: Record<string, any>
): Promise<InitializePaymentResponse> {
  const amountInKobo = amountInNaira * 100;

  try {
    const response = await paystackAPI.post<InitializePaymentResponse>(
      '/transaction/initialize',
      {
        email,
        amount: amountInKobo,
        metadata: metadata || {},
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      `Failed to initialize payment: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Verify a payment with Paystack
 */
export async function verifyPayment(
  reference: string
): Promise<VerifyPaymentResponse> {
  try {
    const response = await paystackAPI.get<VerifyPaymentResponse>(
      `/transaction/verify/${reference}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      `Failed to verify payment: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Get list of Nigerian banks
 */
export async function getNigerianBanks(): Promise<BankInfo[]> {
  try {
    const response = await paystackAPI.get<{
      status: boolean;
      message: string;
      data: BankInfo[];
    }>('/bank?country=NG');
    return response.data.data;
  } catch (error: any) {
    throw new Error(
      `Failed to fetch banks: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Resolve account name from account number and bank code
 */
export async function resolveAccountName(
  accountNumber: string,
  bankCode: string
): Promise<ResolvedAccount> {
  try {
    const response = await paystackAPI.get<{
      status: boolean;
      message: string;
      data: ResolvedAccount;
    }>('/bank/resolve', {
      params: {
        account_number: accountNumber,
        bank_code: bankCode,
      },
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(
      `Failed to resolve account: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Check if a payment was successful
 */
export async function isPaymentSuccessful(reference: string): Promise<boolean> {
  try {
    const result = await verifyPayment(reference);
    return result.data.status === 'success';
  } catch (error) {
    return false;
  }
}
