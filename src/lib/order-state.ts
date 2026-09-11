export const ORDER_STATUSES = [
  'PENDING',
  'PAID_UNASSIGNED',
  'RIDER_ASSIGNED',
  'SCHEDULED',
  'PICKED_UP',
  'IN_CLEANING',
  'IN_PROGRESS',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Laundry fulfilment statuses: the order moves through a rider and a partner.
export const LAUNDRY_FULFILMENT_STATUSES = [
  'PICKED_UP',
  'IN_CLEANING',
  'OUT_FOR_DELIVERY',
] as const;

// On-site service statuses (fumigation, cleaning): a team visits the property,
// no rider or partner is ever involved.
export const ON_SITE_STATUSES = ['SCHEDULED', 'IN_PROGRESS'] as const;

const permittedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: [],
  // A paid order forks by service type: laundry awaits a rider; on-site
  // services are scheduled for a team visit.
  PAID_UNASSIGNED: ['RIDER_ASSIGNED', 'SCHEDULED', 'CANCELLED'],
  RIDER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  PICKED_UP: ['IN_CLEANING', 'CANCELLED'],
  IN_CLEANING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
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
