import { describe, expect, it } from 'vitest';
import { calculatePercentageKobo, koboToNaira, nairaToKobo } from '../../src/lib/money';

describe('money helpers', () => {
  it('converts naira to exact integer kobo and back', () => {
    expect(nairaToKobo(1250.75)).toBe(125075);
    expect(koboToNaira(125075)).toBe(1250.75);
  });

  it('calculates commission in integer kobo without floating-point drift', () => {
    expect(calculatePercentageKobo(125075, 20)).toBe(25015);
  });
});
