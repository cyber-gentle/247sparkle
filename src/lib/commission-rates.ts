/**
 * Commission and revenue-share rates — single source of truth.
 *
 * Rider commission: the percentage of the order total credited to the rider
 * on delivery completion.
 *
 * Partner share: the percentage of the order total that belongs to the
 * partner. 247Sparkle keeps the remainder as its platform margin.
 */

/** Rider earns this % of the delivery fee per completed laundry order. */
export const RIDER_COMMISSION_PERCENT = 20;

/** Partner keeps this fraction of the order total (1.0 = 100%). */
export const PARTNER_REVENUE_SHARE = 0.85;
