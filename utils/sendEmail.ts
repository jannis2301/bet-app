import EmailLog from '../models/EmailLog.js';

interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export class EmailLimitExceededError extends Error {
  constructor() {
    super('Daily email limit reached');
    this.name = 'EmailLimitExceededError';
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

// read lazily, like RESEND_API_KEY below — process.env.DAILY_EMAIL_LIMIT may
// not be set yet at module-import time. Guards against a runaway caller
// (e.g. a reminder loop), not against the mail provider's own — much
// higher — quota.
const getDailyEmailLimit = (): number =>
  Number(process.env.DAILY_EMAIL_LIMIT) || 10;

// Render's free tier blocks outbound traffic on SMTP ports (25/465/587)
// entirely, so nodemailer-over-SMTP can never connect from this deployment —
// Resend's HTTPS API is the same provider, just over port 443, which isn't
// blocked. See https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailArgs): Promise<void> => {
  const since = new Date(Date.now() - DAY_MS);
  const sentToday = await EmailLog.countDocuments({ sentAt: { $gte: since } });
  if (sentToday >= getDailyEmailLimit()) {
    throw new EmailLimitExceededError();
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(
      `Resend API error (${response.status}): ${await response.text()}`
    );
  }
  console.log(`Email sent to ${to}: ${subject}`);

  await EmailLog.create({});
};
