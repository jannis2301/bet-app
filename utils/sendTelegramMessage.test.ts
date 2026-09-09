import { beforeEach, describe, expect, it, vi } from 'vitest';
import TelegramLog from '../models/TelegramLog.js';
import {
  TelegramLimitExceededError,
  sendTelegramMessage,
} from './sendTelegramMessage.js';

const fetchMock = vi
  .fn()
  .mockResolvedValue(new Response(null, { status: 200 }));
vi.stubGlobal('fetch', fetchMock);

const messageArgs = {
  chatId: '12345',
  text: 'Der 3. Spieltag startet bald. Hast du schon getippt?',
};

describe('sendTelegramMessage', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.DAILY_TELEGRAM_LIMIT = '50';
  });

  it('sends a message to the configured chat', async () => {
    await sendTelegramMessage(messageArgs);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          chat_id: '12345',
          text: messageArgs.text,
        }),
      })
    );
  });

  it('records a log entry for each message sent', async () => {
    await sendTelegramMessage(messageArgs);

    await expect(TelegramLog.countDocuments()).resolves.toBe(1);
  });

  it('throws when the Telegram API responds with an error', async () => {
    fetchMock.mockResolvedValue(new Response('bad request', { status: 400 }));

    await expect(sendTelegramMessage(messageArgs)).rejects.toThrow(
      'Telegram API error'
    );
    await expect(TelegramLog.countDocuments()).resolves.toBe(0);
  });

  it('refuses to send once the daily limit is reached', async () => {
    process.env.DAILY_TELEGRAM_LIMIT = '2';
    await sendTelegramMessage(messageArgs);
    await sendTelegramMessage(messageArgs);
    fetchMock.mockClear();

    await expect(sendTelegramMessage(messageArgs)).rejects.toThrow(
      TelegramLimitExceededError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
