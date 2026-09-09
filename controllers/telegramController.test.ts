import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../app.js';
import User from '../models/User.js';
import * as sendTelegramMessageModule from '../utils/sendTelegramMessage.js';

const sendTelegramMessage = vi.spyOn(
  sendTelegramMessageModule,
  'sendTelegramMessage'
);

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

const createUser = async (overrides: Record<string, unknown> = {}) =>
  User.create({
    name: 'Test User',
    email: `${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
    isApproved: true,
    ...overrides,
  });

beforeEach(() => {
  sendTelegramMessage.mockReset();
  sendTelegramMessage.mockResolvedValue(undefined);
  process.env.TELEGRAM_BOT_USERNAME = 'TippyBot';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'test-webhook-secret';
});

describe('GET /api/telegram/link-token', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/telegram/link-token');

    expect(res.status).toBe(401);
  });

  it('redirects to a deep link containing a verifiable token', async () => {
    const user = await createUser();
    const token = signToken(user._id.toString());

    const res = await request(app)
      .get('/api/telegram/link-token')
      .set('Cookie', [`token=${token}`]);

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/^https:\/\/t\.me\/TippyBot\?start=.+/);
    // Telegram's t.me/<bot>?start=<payload> deep link only allows up to 64
    // characters from [A-Za-z0-9_-] — anything else (e.g. a raw JWT, with
    // its dots and 100+ chars) gets silently mangled by Telegram
    const linkToken = res.headers.location.split('start=')[1];
    expect(linkToken.length).toBeLessThanOrEqual(64);
    expect(linkToken).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('POST /api/telegram/webhook', () => {
  const sendUpdate = (body: Record<string, unknown>) =>
    request(app)
      .post('/api/telegram/webhook')
      .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
      .send(body);

  it('rejects a request without the correct secret token', async () => {
    const res = await request(app)
      .post('/api/telegram/webhook')
      .send({ message: { text: '/start bogus', chat: { id: 1 } } });

    expect(res.status).toBe(401);
  });

  it('links the chat id to the user identified by a valid token', async () => {
    const user = await createUser();
    const linkToken = user.createTelegramLinkToken();
    await user.save({ validateBeforeSave: false });

    const res = await sendUpdate({
      message: { text: `/start ${linkToken}`, chat: { id: 987654321 } },
    });

    expect(res.status).toBe(200);
    const stored = await User.findById(user._id);
    expect(stored?.telegramChatId).toBe('987654321');
    expect(sendTelegramMessage).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: '987654321' })
    );
  });

  it('responds 200 without linking anything on an expired token', async () => {
    const user = await createUser();
    const linkToken = user.createTelegramLinkToken();
    user.telegramLinkTokenExpires = new Date(Date.now() - 1000);
    await user.save({ validateBeforeSave: false });

    const res = await sendUpdate({
      message: { text: `/start ${linkToken}`, chat: { id: 555 } },
    });

    expect(res.status).toBe(200);
    const stored = await User.findById(user._id);
    expect(stored?.telegramChatId).toBeUndefined();
  });

  it('responds 200 without linking anything on an invalid token', async () => {
    const res = await sendUpdate({
      message: { text: '/start not-a-real-token', chat: { id: 42 } },
    });

    expect(res.status).toBe(200);
    expect(sendTelegramMessage).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: '42' })
    );
    await expect(
      User.countDocuments({ telegramChatId: { $exists: true } })
    ).resolves.toBe(0);
  });

  it('ignores updates without a /start command', async () => {
    const res = await sendUpdate({
      message: { text: 'hello', chat: { id: 1 } },
    });

    expect(res.status).toBe(200);
    expect(sendTelegramMessage).not.toHaveBeenCalled();
  });
});
