import { describe, expect, it } from 'vitest';

import { isWhiteGroupItem, laundryPickupSchema } from '@/lib/laundry-order';

describe('white-group classification (new-order flow)', () => {
  it('flags the pricing-table white colour-group row', () => {
    expect(isWhiteGroupItem('White Items (Colour Group)')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isWhiteGroupItem('white shirts')).toBe(true);
  });

  it('leaves regular laundry items unflagged', () => {
    expect(isWhiteGroupItem('Lace')).toBe(false);
    expect(isWhiteGroupItem('Agbada')).toBe(false);
    expect(isWhiteGroupItem('')).toBe(false);
  });
});

describe('laundry pickup schema (new-order flow)', () => {
  it('requires address, date and time for home pickup', () => {
    const result = laundryPickupSchema.safeParse({
      pickupOption: 'HOME_PICKUP',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('pickupAddress');
      expect(paths).toContain('pickupDate');
      expect(paths).toContain('pickupTime');
    }
  });

  it('accepts home pickup with full details', () => {
    const result = laundryPickupSchema.safeParse({
      pickupOption: 'HOME_PICKUP',
      pickupAddress: '12 Upu Road, Otukpo',
      pickupDate: '2026-09-10',
      pickupTime: '09:00',
    });

    expect(result.success).toBe(true);
  });

  it('asks nothing extra for partner drop-off', () => {
    const result = laundryPickupSchema.safeParse({
      pickupOption: 'PARTNER_DROPOFF',
    });

    expect(result.success).toBe(true);
  });
});
