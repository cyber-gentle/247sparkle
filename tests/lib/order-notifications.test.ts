import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  order: {
    findUnique: vi.fn(),
  },
}));

const emailLib = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}));

const loggerLib = vi.hoisted(() => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: db }));
vi.mock('@/lib/email', () => emailLib);
vi.mock('@/lib/logger', () => loggerLib);

import { getOrderStatusCopy, notifyOrderStatusChange } from '@/lib/order-notifications';

const ORDER = {
  id: 'order-abcdef123456',
  serviceType: 'LAUNDRY',
  customer: { user: { email: 'customer@example.com', fullName: 'Ada Obi' } },
};

describe('order status notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.order.findUnique.mockResolvedValue(ORDER);
    emailLib.sendEmail.mockResolvedValue({ delivered: true, provider: 'resend' });
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.test';
  });

  it('emails the customer for a customer-facing status', async () => {
    const sent = await notifyOrderStatusChange(ORDER.id, 'OUT_FOR_DELIVERY');

    expect(sent).toBe(true);
    expect(emailLib.sendEmail).toHaveBeenCalledTimes(1);

    const message = emailLib.sendEmail.mock.calls[0][0];
    expect(message.to).toBe('customer@example.com');
    expect(message.subject).toContain('out for delivery');
    expect(message.text).toContain('Ada Obi');
    // Deep-links to the customer's own order page.
    expect(message.text).toContain(`https://example.test/customer/orders/${ORDER.id}`);
  });

  it('does not email for internal-only statuses', async () => {
    expect(await notifyOrderStatusChange(ORDER.id, 'PENDING')).toBe(false);
    expect(await notifyOrderStatusChange(ORDER.id, 'PAID_UNASSIGNED')).toBe(false);
    expect(emailLib.sendEmail).not.toHaveBeenCalled();
  });

  it('skips silently when the order has no recipient', async () => {
    db.order.findUnique.mockResolvedValue(null);

    expect(await notifyOrderStatusChange('missing', 'COMPLETED')).toBe(false);
    expect(emailLib.sendEmail).not.toHaveBeenCalled();
    expect(loggerLib.logger.warn).toHaveBeenCalledWith(
      'order_notification_skipped',
      expect.objectContaining({ reason: 'NO_RECIPIENT' })
    );
  });

  it('reports undelivered when no email provider is configured', async () => {
    emailLib.sendEmail.mockResolvedValue({
      delivered: false,
      provider: 'none',
      reason: 'EMAIL_NOT_CONFIGURED',
    });

    expect(await notifyOrderStatusChange(ORDER.id, 'COMPLETED')).toBe(false);
    expect(loggerLib.logger.warn).toHaveBeenCalledWith(
      'order_notification_not_delivered',
      expect.objectContaining({ reason: 'EMAIL_NOT_CONFIGURED' })
    );
  });

  it('never throws when the lookup fails, so transitions are not rolled back', async () => {
    db.order.findUnique.mockRejectedValue(new Error('db down'));

    await expect(notifyOrderStatusChange(ORDER.id, 'COMPLETED')).resolves.toBe(false);
    expect(loggerLib.logger.error).toHaveBeenCalledWith(
      'order_notification_failed',
      expect.objectContaining({ orderId: ORDER.id })
    );
  });

  it('exposes copy for every customer-facing status only', () => {
    expect(getOrderStatusCopy('RIDER_ASSIGNED')).toBeDefined();
    expect(getOrderStatusCopy('SCHEDULED')).toBeDefined();
    expect(getOrderStatusCopy('PICKED_UP')).toBeDefined();
    expect(getOrderStatusCopy('IN_CLEANING')).toBeDefined();
    expect(getOrderStatusCopy('IN_PROGRESS')).toBeDefined();
    expect(getOrderStatusCopy('OUT_FOR_DELIVERY')).toBeDefined();
    expect(getOrderStatusCopy('COMPLETED')).toBeDefined();

    expect(getOrderStatusCopy('PENDING')).toBeUndefined();
    expect(getOrderStatusCopy('PAID_UNASSIGNED')).toBeUndefined();
    expect(getOrderStatusCopy('CANCELLED')).toBeUndefined();
  });
});
