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

  it('allows the on-site service lifecycle without a rider', () => {
    expect(canTransitionOrder('PAID_UNASSIGNED', 'SCHEDULED')).toBe(true);
    expect(canTransitionOrder('SCHEDULED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionOrder('IN_PROGRESS', 'COMPLETED')).toBe(true);
  });

  it('keeps the laundry and on-site tracks mutually exclusive', () => {
    expect(canTransitionOrder('PAID_UNASSIGNED', 'PICKED_UP')).toBe(false);
    expect(canTransitionOrder('SCHEDULED', 'RIDER_ASSIGNED')).toBe(false);
    expect(canTransitionOrder('SCHEDULED', 'IN_CLEANING')).toBe(false);
    expect(canTransitionOrder('RIDER_ASSIGNED', 'IN_PROGRESS')).toBe(false);
  });

  it('rejects skipped, unpaid, and terminal-state transitions', () => {
    expect(canTransitionOrder('PENDING', 'RIDER_ASSIGNED')).toBe(false);
    expect(canTransitionOrder('PAID_UNASSIGNED', 'COMPLETED')).toBe(false);
    expect(canTransitionOrder('COMPLETED', 'OUT_FOR_DELIVERY')).toBe(false);
  });
});
