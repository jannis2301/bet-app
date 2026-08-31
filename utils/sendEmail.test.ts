import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmailLog from '../models/EmailLog.js';
import { EmailLimitExceededError, sendEmail } from './sendEmail.js';

const fetchMock = vi
  .fn()
  .mockResolvedValue(new Response(null, { status: 200 }));
vi.stubGlobal('fetch', fetchMock);

const emailArgs = {
  to: 'someone@example.com',
  subject: 'Hallo',
  text: 'plain text',
  html: '<p>html</p>',
};

describe('sendEmail', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    process.env.RESEND_API_KEY = 'test-key';
    process.env.EMAIL_FROM = 'Tippy <no-reply@example.com>';
    process.env.DAILY_EMAIL_LIMIT = '10';
  });

  it('sends an email with the configured from address', async () => {
    await sendEmail(emailArgs);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
        body: JSON.stringify({
          from: 'Tippy <no-reply@example.com>',
          to: 'someone@example.com',
          subject: 'Hallo',
          text: 'plain text',
          html: '<p>html</p>',
        }),
      })
    );
  });

  it('records a log entry for each email sent', async () => {
    await sendEmail(emailArgs);

    await expect(EmailLog.countDocuments()).resolves.toBe(1);
  });

  it('throws when the Resend API responds with an error', async () => {
    fetchMock.mockResolvedValue(new Response('bad request', { status: 400 }));

    await expect(sendEmail(emailArgs)).rejects.toThrow('Resend API error');
    await expect(EmailLog.countDocuments()).resolves.toBe(0);
  });

  it('refuses to send once the daily limit is reached', async () => {
    process.env.DAILY_EMAIL_LIMIT = '2';
    await sendEmail(emailArgs);
    await sendEmail(emailArgs);
    fetchMock.mockClear();

    await expect(sendEmail(emailArgs)).rejects.toThrow(EmailLimitExceededError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
