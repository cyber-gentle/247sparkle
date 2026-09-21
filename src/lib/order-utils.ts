/**
 * Order number formatting utilities
 * Convention: "Order #{6 uppercased alphanumeric digit}" (e.g. "Order #A1B2C3")
 */

/**
 * Extracts a 6-character uppercased alphanumeric code from an order ID.
 * Uses the highest-entropy tail portion of the identifier (e.g. cuid) and normalizes it.
 * Falls back to zero-padding if shorter than 6 alphanumeric characters.
 *
 * Example: "clh7x9q120000jk08abcd12" -> "ABCD12"
 * Example: "order-available" -> "LABLE" -> padded if needed
 */
export function getOrderCode(orderId: string): string {
  const clean = (orderId || '').replace(/[^a-zA-Z0-9]/g, '');
  const tail = clean.slice(-6);
  return (tail || '000000').toUpperCase().padStart(6, '0');
}

/**
 * Returns the human-readable order number following the convention:
 * "Order #{6 uppercased alphanumeric digit}"
 *
 * Example: "Order #ABCD12"
 */
export function formatOrderNumber(orderId: string): string {
  return `Order #${getOrderCode(orderId)}`;
}
