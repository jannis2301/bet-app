import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UnAuthenticatedError } from '../errors/index.js';
import User from '../models/User.js';
// imported via namespace (not destructured) so tests can vi.spyOn the
// exported binding directly — see betsController.test.ts for the same pattern
import * as sendTelegramMessageModule from '../utils/sendTelegramMessage.js';

interface TelegramUpdate {
  message?: {
    text?: string;
    chat: { id: number };
  };
}

// a plain GET redirect (not a JSON response fetched then window.open()'d) —
// so the browser treats opening the deep link as a direct result of the
// user's click on the <a target="_blank"> in Profile.tsx, rather than a
// window.open() call after an async round-trip, which popup blockers
// routinely (if inconsistently) block since it no longer runs inside the
// click's user-activation window
export const getLinkToken = async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.user?.userId });
  if (!user) {
    throw new UnAuthenticatedError('Authentication Invalid');
  }

  const token = user.createTelegramLinkToken();
  await user.save({ validateBeforeSave: false });

  res.redirect(
    `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${token}`
  );
};

// Hit by Telegram's servers, not the SPA — authenticated via the shared
// secret Telegram echoes back (set via the Bot API's setWebhook
// `secret_token` param), not the login cookie.
export const telegramWebhook = async (req: Request, res: Response) => {
  const secret = req.get('X-Telegram-Bot-Api-Secret-Token');
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    res.sendStatus(StatusCodes.UNAUTHORIZED);
    return;
  }

  // Telegram retries the update on anything but a 2xx response, so every
  // path below still responds 200 once handling is done — errors are only
  // logged, never surfaced back to Telegram.
  try {
    const update = req.body as TelegramUpdate;
    const text = update.message?.text;
    const chatId = update.message?.chat.id;

    if (text?.startsWith('/start') && chatId) {
      const linkToken = text.split(' ')[1];
      const hashedToken = linkToken
        ? createHash('sha256').update(linkToken).digest('hex')
        : null;
      const user = hashedToken
        ? await User.findOne({
            telegramLinkToken: hashedToken,
            telegramLinkTokenExpires: { $gt: new Date() },
          }).select('+telegramLinkToken +telegramLinkTokenExpires')
        : null;

      if (!user) {
        await sendTelegramMessageModule.sendTelegramMessage({
          chatId: String(chatId),
          text: 'Dieser Link ist ungültig oder abgelaufen. Fordere in deinen Profil-Einstellungen einen neuen an.',
        });
      } else {
        user.telegramChatId = String(chatId);
        user.telegramLinkToken = undefined;
        user.telegramLinkTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });
        await sendTelegramMessageModule.sendTelegramMessage({
          chatId: String(chatId),
          text: 'Dein Telegram-Account ist jetzt verknüpft — du bekommst ab jetzt Erinnerungen zu neuen Spieltagen hier.',
        });
      }
    }
  } catch (error) {
    console.error('Failed to process Telegram webhook update:', error);
  }

  res.sendStatus(StatusCodes.OK);
};
