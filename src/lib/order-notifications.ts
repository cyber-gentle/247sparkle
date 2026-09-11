import prisma from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import type { OrderStatus } from '@/lib/order-state';

/**
 * Customer-facing copy for each status a customer should hear about.
 *
 * Statuses that are purely internal (`PENDING`, `PAID_UNASSIGNED`) are
 * deliberately absent: the customer has just completed checkout and does not
 * need a second email restating it.
 */
const STATUS_COPY: Partial<Record<OrderStatus, { subject: string; headline: string }>> = {
  RIDER_ASSIGNED: {
    subject: 'A rider is on the way for your 247Sparkle order',
    headline: 'A rider has been assigned and will arrive for pickup shortly.',
  },
  SCHEDULED: {
    subject: 'Your 247Sparkle service visit is scheduled',
    headline: 'Your service visit has been scheduled. Our team will arrive as planned.',
  },
  PICKED_UP: {
    subject: 'Your 247Sparkle items have been picked up',
    headline: 'Your items have been collected and are on the way to be cleaned.',
  },
  IN_CLEANING: {
    subject: 'Your 247Sparkle order is being cleaned',
    headline: 'Your items are now being cleaned with care.',
  },
  IN_PROGRESS: {
    subject: 'Your 247Sparkle service is in progress',
    headline: 'Our team is on site and your service is currently in progress.',
  },
  OUT_FOR_DELIVERY: {
    subject: 'Your 247Sparkle order is out for delivery',
    headline: 'Your clean items are out for delivery and will reach you soon.',
  },
  COMPLETED: {
    subject: 'Your 247Sparkle order is complete',
    headline: 'Your order is complete. Thank you for choosing 247Sparkle!',
  },
};

export function getOrderStatusCopy(status: OrderStatus) {
  return STATUS_COPY[status];
}

function buildOrderLink(orderId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.247sparkle.com';
  return `${baseUrl.replace(/\/$/, '')}/customer/orders/${orderId}`;
}

/**
 * Emails the customer that their order moved to a new status.
 *
 * This is best-effort, non-blocking infrastructure: a notification failure must
 * never roll back or fail an already-committed order transition, so every error
 * is caught and logged rather than thrown. Returns `true` only when a message
 * was actually handed to the provider.
 */
export async function notifyOrderStatusChange(
  orderId: string,
  status: OrderStatus
): Promise<boolean> {
  const copy = STATUS_COPY[status];
  if (!copy) return false;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        serviceType: true,
        customer: { select: { user: { select: { email: true, fullName: true } } } },
      },
    });

    const user = order?.customer?.user;
    if (!order || !user?.email) {
      logger.warn('order_notification_skipped', { orderId, status, reason: 'NO_RECIPIENT' });
      return false;
    }

    const orderLink = buildOrderLink(orderId);
    const reference = orderId.slice(-8).toUpperCase();
    const service = order.serviceType.replace(/_/g, ' ').toLowerCase();

    const result = await sendEmail({
      to: user.email,
      subject: copy.subject,
      text: [
        `Hello ${user.fullName},`,
        '',
        copy.headline,
        '',
        `Service: ${service}`,
        `Order reference: ${reference}`,
        '',
        `Track your order: ${orderLink}`,
        '',
        '— 247Sparkle Laundry & Cleaning Services',
      ].join('\n'),
      html: `
        <p>Hello ${user.fullName},</p>
        <p>${copy.headline}</p>
        <p>
          <strong>Service:</strong> ${service}<br />
          <strong>Order reference:</strong> ${reference}
        </p>
        <p><a href="${orderLink}">Track your order</a></p>
        <p>— 247Sparkle Laundry &amp; Cleaning Services</p>
      `,
    });

    if (!result.delivered) {
      // `EMAIL_NOT_CONFIGURED` is expected until a provider key is supplied.
      logger.warn('order_notification_not_delivered', {
        orderId,
        status,
        reason: result.reason,
      });
      return false;
    }

    logger.info('order_notification_sent', { orderId, status });
    return true;
  } catch (error) {
    logger.error('order_notification_failed', { orderId, status, error });
    return false;
  }
}
