export const ORDER_STATUSES = [
  'PENDING',
  'PAID_UNASSIGNED',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'IN_CLEANING',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const permittedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: [],
  PAID_UNASSIGNED: ['RIDER_ASSIGNED', 'CANCELLED'],
  RIDER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_CLEANING', 'CANCELLED'],
  IN_CLEANING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransitionOrder(from: string, to: string): boolean {
  return isOrderStatus(from) && isOrderStatus(to) && permittedTransitions[from].includes(to);
}

export function assertOrderTransition(from: string, to: string): asserts to is OrderStatus {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Invalid order transition: ${from} → ${to}`);
  }
}
