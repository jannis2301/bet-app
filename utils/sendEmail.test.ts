import nodemailer from 'nodemailer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendEmail } from './sendEmail.js';

const sendMail = vi.fn().mockResolvedValue(undefined);

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail })),
  },
}));

describe('sendEmail', () => {
  beforeEach(() => {
    sendMail.mockClear();
    vi.mocked(nodemailer.createTransport).mockClear();
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'BetMasters <no-reply@example.com>';
  });

  it('sends an email with the configured from address', async () => {
    await sendEmail({
      to: 'someone@example.com',
      subject: 'Hallo',
      text: 'plain text',
      html: '<p>html</p>',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'BetMasters <no-reply@example.com>',
      to: 'someone@example.com',
      subject: 'Hallo',
      text: 'plain text',
      html: '<p>html</p>',
    });
  });
});
