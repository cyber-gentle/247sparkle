import { describe, expect, it } from 'vitest';
import { formatOrderNumber, getOrderCode } from '@/lib/order-utils';

describe('order-utils', () => {
  describe('getOrderCode', () => {
    it('extracts exactly 6 uppercase alphanumeric characters from a standard CUID', () => {
      const code = getOrderCode('clh7x9q120000jk08abcd12');
      expect(code).toBe('ABCD12');
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('strips non-alphanumeric characters and takes the last 6 characters', () => {
      const code = getOrderCode('order-available');
      // 'orderavailable'.slice(-6) => 'ilable' => 'ILABLE'
      expect(code).toBe('ILABLE');
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('pads with leading zeros if shorter than 6 alphanumeric characters', () => {
      expect(getOrderCode('a1')).toBe('0000A1');
      expect(getOrderCode('123')).toBe('000123');
      expect(getOrderCode('')).toBe('000000');
    });
  });

  describe('formatOrderNumber', () => {
    it('formats as "Order #{6 uppercased alphanumeric digit}"', () => {
      expect(formatOrderNumber('clh7x9q120000jk08abcd12')).toBe('Order #ABCD12');
      expect(formatOrderNumber('order-available')).toBe('Order #ILABLE');
      expect(formatOrderNumber('42')).toBe('Order #000042');
    });
  });
});
