import { describe, expect, it } from 'vitest';
import { canTransitionOrder } from '../../src/lib/order-state';

describe('order state transitions', () => {
  it('allows only the sequential fulfilment lifecycle after payment', () => {
    expect(canTransitionOrder('PAID_UNASSIGNED', 'RIDER_ASSIGNED')).toBe(true);
    expect(canTransitionOrder('RIDER_ASSIGNED', 'PICKED_UP')).toBe(true);
    expect(canTransitionOrder('PICKED_UP', 'IN_CLEANING')).toBe(true);
    expect(canTransitionOrder('IN_CLEANING', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(canTransitionOrder('OUT_FOR_DELIVERY', 'COMPLETED')).toBe(true);
  });

  it('rejects skipped, unpaid, and terminal-state transitions', () => {
    expect(canTransitionOrder('PENDING', 'RIDER_ASSIGNED')).toBe(false);
    expect(canTransitionOrder('PAID_UNASSIGNED', 'COMPLETED')).toBe(false);
    expect(canTransitionOrder('COMPLETED', 'OUT_FOR_DELIVERY')).toBe(false);
  });
});
