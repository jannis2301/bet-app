import TelegramLog from '../models/TelegramLog.js';

interface SendTelegramMessageArgs {
  chatId: string;
  text: string;
}

export class TelegramLimitExceededError extends Error {
  constructor() {
    super('Daily telegram message limit reached');
    this.name = 'TelegramLimitExceededError';
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

// read lazily, like TELEGRAM_BOT_TOKEN below — process.env.DAILY_TELEGRAM_LIMIT
// may not be set yet at module-import time. Guards against a runaway caller
// (e.g. a reminder loop), not against Telegram's own — much higher — quota.
const getDailyTelegramLimit = (): number =>
  Number(process.env.DAILY_TELEGRAM_LIMIT) || 50;

export const sendTelegramMessage = async ({
  chatId,
  text,
}: SendTelegramMessageArgs): Promise<void> => {
  const since = new Date(Date.now() - DAY_MS);
  const sentToday = await TelegramLog.countDocuments({
    sentAt: { $gte: since },
  });
  if (sentToday >= getDailyTelegramLimit()) {
    throw new TelegramLimitExceededError();
  }

  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // parse_mode 'HTML' lets callers (e.g. matchdayReminder.ts) send a
      // clickable <a> link under a readable label instead of a bare URL —
      // safe here since every caller's text is our own static copy, never
      // untrusted input that would need escaping
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(10_000),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Telegram API error (${response.status}): ${await response.text()}`
    );
  }
  console.log(`Telegram message sent to chat ${chatId}`);

  await TelegramLog.create({});
};
