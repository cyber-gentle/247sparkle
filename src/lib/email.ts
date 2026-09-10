import { logger } from '@/lib/logger';

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailProvider = 'resend' | 'none';

export type EmailResult = {
  delivered: boolean;
  provider: EmailProvider;
  reason?: string;
};

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = '247Sparkle <no-reply@247sparkle.com>';

export function getEmailFromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
}

/**
 * Email is optional infrastructure: the platform must stay fully functional
 * (order flow, payments, dashboards) even when no provider is wired up yet.
 * Configure `RESEND_API_KEY` to enable real delivery at launch.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    // Never log the recipient address; keep operational logs PII-free.
    logger.warn('email_not_configured', { subject: message.subject });
    return { delivered: false, provider: 'none', reason: 'EMAIL_NOT_CONFIGURED' };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getEmailFromAddress(),
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      logger.error('email_send_failed', {
        status: response.status,
        detail: detail.slice(0, 300),
      });
      return { delivered: false, provider: 'resend', reason: `HTTP_${response.status}` };
    }

    return { delivered: true, provider: 'resend' };
  } catch (error) {
    logger.error('email_send_error', { error });
    return { delivered: false, provider: 'resend', reason: 'NETWORK_ERROR' };
  }
}
