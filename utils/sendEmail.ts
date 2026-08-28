import nodemailer, { type Transporter } from 'nodemailer';

interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
  html: string;
}

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
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};
