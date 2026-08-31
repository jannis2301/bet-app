import nodemailer, { type Transporter } from 'nodemailer';
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

// read lazily, like SMTP_* below — process.env.DAILY_EMAIL_LIMIT may not be
// set yet at module-import time. Guards against a runaway caller (e.g. a
// reminder loop), not against the mail provider's own — much higher — quota.
const getDailyEmailLimit = (): number =>
  Number(process.env.DAILY_EMAIL_LIMIT) || 10;

let transporter: Transporter | undefined;

// created lazily (not at module load) so env vars set after import — e.g. by
// dotenv.config() in server.ts, which runs before this module is used but
// after it would otherwise be imported — are picked up correctly
const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      // true only for port 465 (implicit TLS) — 587/25 use STARTTLS instead
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // without these, a stalled SMTP handshake (network flakiness, a
      // provider silently dropping packets) hangs indefinitely — and since
      // callers await sendEmail(), that blocks the whole HTTP response
      // (e.g. registration) forever instead of failing into the catch block
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
  }
  return transporter;
};

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

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  console.log(`Email sent to ${to}: ${subject}`);

  await EmailLog.create({});
};
