import nodemailer from 'nodemailer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmailLog from '../models/EmailLog.js';
import { EmailLimitExceededError, sendEmail } from './sendEmail.js';

const sendMail = vi.fn().mockResolvedValue(undefined);

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail })),
  },
}));

const emailArgs = {
  to: 'someone@example.com',
  subject: 'Hallo',
  text: 'plain text',
  html: '<p>html</p>',
};

describe('sendEmail', () => {
  beforeEach(() => {
    sendMail.mockClear();
    vi.mocked(nodemailer.createTransport).mockClear();
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'Tippy <no-reply@example.com>';
    process.env.DAILY_EMAIL_LIMIT = '10';
  });

  it('sends an email with the configured from address', async () => {
    await sendEmail(emailArgs);

    expect(sendMail).toHaveBeenCalledWith({
      from: 'Tippy <no-reply@example.com>',
      to: 'someone@example.com',
      subject: 'Hallo',
      text: 'plain text',
      html: '<p>html</p>',
    });
  });

  it('records a log entry for each email sent', async () => {
    await sendEmail(emailArgs);

    await expect(EmailLog.countDocuments()).resolves.toBe(1);
  });

  it('refuses to send once the daily limit is reached', async () => {
    process.env.DAILY_EMAIL_LIMIT = '2';
    await sendEmail(emailArgs);
    await sendEmail(emailArgs);
    sendMail.mockClear();

    await expect(sendEmail(emailArgs)).rejects.toThrow(EmailLimitExceededError);
    expect(sendMail).not.toHaveBeenCalled();
  });
});
