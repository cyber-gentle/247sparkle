// Database enums and constants
// Since SQLite doesn't support enums, we use string constants

export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  RIDER: 'RIDER',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  SUSPENDED: 'SUSPENDED',
  REJECTED: 'REJECTED',
} as const;

export type ApprovalStatusType = typeof ApprovalStatus[keyof typeof ApprovalStatus];

export const AvailabilityStatus = {
  WORKING: 'WORKING',
  OFF_DUTY: 'OFF_DUTY',
} as const;

export type AvailabilityStatusType = typeof AvailabilityStatus[keyof typeof AvailabilityStatus];

export const WorkloadStatus = {
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
} as const;

export type WorkloadStatusType = typeof WorkloadStatus[keyof typeof WorkloadStatus];

export const ServiceType = {
  LAUNDRY: 'LAUNDRY',
  HOME_CLEANING: 'HOME_CLEANING',
  OFFICE_CLEANING: 'OFFICE_CLEANING',
  FUMIGATION: 'FUMIGATION',
} as const;

export type ServiceTypeType = typeof ServiceType[keyof typeof ServiceType];

export const OrderStatus = {
  PENDING: 'PENDING',
  RIDER_ASSIGNED: 'RIDER_ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_CLEANING: 'IN_CLEANING',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  FAILED: 'FAILED',
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PickupOption = {
  HOME_PICKUP: 'HOME_PICKUP',
  PARTNER_DROPOFF: 'PARTNER_DROPOFF',
  ON_SITE: 'ON_SITE',
} as const;

export type PickupOptionType = typeof PickupOption[keyof typeof PickupOption];

export const CommissionStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
} as const;

export type CommissionStatusType = typeof CommissionStatus[keyof typeof CommissionStatus];

export const WithdrawalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
} as const;

export type WithdrawalStatusType = typeof WithdrawalStatus[keyof typeof WithdrawalStatus];

export const QuotationServiceType = {
  OFFICE_CLEANING: 'OFFICE_CLEANING',
  OFFICE_FUMIGATION: 'OFFICE_FUMIGATION',
  COMMERCIAL_FUMIGATION: 'COMMERCIAL_FUMIGATION',
} as const;

export type QuotationServiceTypeType = typeof QuotationServiceType[keyof typeof QuotationServiceType];

export const QuotationStatus = {
  NEW: 'NEW',
  RESPONDED: 'RESPONDED',
  CONVERTED: 'CONVERTED',
  EXPIRED: 'EXPIRED',
} as const;

export type QuotationStatusType = typeof QuotationStatus[keyof typeof QuotationStatus];
