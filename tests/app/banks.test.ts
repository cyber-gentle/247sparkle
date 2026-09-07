import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const paystackLib = vi.hoisted(() => ({
  getNigerianBanks: vi.fn(),
  resolveAccountName: vi.fn(),
}));

const rateLimitLib = vi.hoisted(() => ({
  rateLimitRequest: vi.fn().mockResolvedValue(null),
  RATE_LIMIT_POLICIES: {
    mutation: {},
  },
}));

vi.mock('@/lib/paystack', () => ({
  getNigerianBanks: paystackLib.getNigerianBanks,
  resolveAccountName: paystackLib.resolveAccountName,
}));

vi.mock('@/lib/api-rate-limit', () => ({
  rateLimitRequest: rateLimitLib.rateLimitRequest,
  RATE_LIMIT_POLICIES: rateLimitLib.RATE_LIMIT_POLICIES,
}));

import { GET as getBanks } from '@/app/api/banks/route';
import { GET as resolveBank } from '@/app/api/banks/resolve/route';

describe('Banks API proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/banks', () => {
    it('returns banks from Paystack when available', async () => {
      paystackLib.getNigerianBanks.mockResolvedValue([
        { id: 1, name: 'Access Bank', code: '044' },
      ]);

      const request = new NextRequest('http://localhost/api/banks');
      const response = await getBanks(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.banks).toHaveLength(1);
      expect(data.banks[0].name).toBe('Access Bank');
    });

    it('falls back to static bank list if Paystack API fails', async () => {
      paystackLib.getNigerianBanks.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost/api/banks');
      const response = await getBanks(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.banks.length).toBeGreaterThan(5);
    });
  });

  describe('GET /api/banks/resolve', () => {
    it('returns 400 when accountNumber or bankCode is missing', async () => {
      const request = new NextRequest('http://localhost/api/banks/resolve');
      const response = await resolveBank(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('required');
    });

    it('resolves account name successfully', async () => {
      paystackLib.resolveAccountName.mockResolvedValue({
        account_number: '0123456789',
        account_name: 'ADAEZE OKONKWO',
        bank_id: 1,
      });

      const request = new NextRequest(
        'http://localhost/api/banks/resolve?accountNumber=0123456789&bankCode=044'
      );
      const response = await resolveBank(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.resolved.account_name).toBe('ADAEZE OKONKWO');
    });
  });
});
