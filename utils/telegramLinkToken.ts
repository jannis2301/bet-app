import jwt from 'jsonwebtoken';

// short-lived — this token only lives long enough for the user to tap the
// deep-link and hit /start in Telegram right after requesting it
const TELEGRAM_LINK_TOKEN_LIFETIME = '15m';

interface TelegramLinkTokenPayload {
  userId: string;
}

export const signTelegramLinkToken = (userId: string): string =>
  jwt.sign(
    { userId } satisfies TelegramLinkTokenPayload,
    process.env.JWT_SECRET as string,
    { expiresIn: TELEGRAM_LINK_TOKEN_LIFETIME }
  );

export const verifyTelegramLinkToken = (token: string): string | null => {
  try {
    const { userId } = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TelegramLinkTokenPayload;
    return userId;
  } catch {
    return null;
  }
};
