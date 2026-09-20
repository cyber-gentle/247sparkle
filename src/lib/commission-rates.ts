/**
 * Commission and revenue-share rates — single source of truth.
 *
 * Rider commission: a flat fee credited to the rider's wallet on delivery
 * completion. Expressed in kobo (₦1 = 100 kobo).
 *
 * Partner share: the fraction of the order total that belongs to the
 * partner. 247Sparkle keeps the remainder as its platform margin.
 */

/** Rider earns a flat ₦200 per completed delivery. */
export const RIDER_COMMISSION_KOBO = 20_000; // ₦200

/** Partner keeps this fraction of the order total (1.0 = 100%). */
export const PARTNER_REVENUE_SHARE = 0.85;
