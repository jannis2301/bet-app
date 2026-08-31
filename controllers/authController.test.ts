import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../app.js';
import User from '../models/User.js';
import * as sendEmailModule from '../utils/sendEmail.js';

const sendEmail = vi.spyOn(sendEmailModule, 'sendEmail');

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

// pulls the reset token back out of the email forgotPassword sent, the way a
// real user would get it from the link rather than from an API response
const extractResetTokenFromLastEmail = () => {
  const lastCall = sendEmail.mock.calls.at(-1);
  const match = lastCall?.[0].text.match(/token=([^\s]+)/);
  if (!match) throw new Error('No reset token found in the sent email');
  return match[1];
};

// approve/reject share the same token — pulls it out of the admin email the
// way an admin would get it from the link rather than from an API response
const extractApprovalTokenFromLastEmail = () => {
  const lastCall = sendEmail.mock.calls.at(-1);
  const match = lastCall?.[0].text.match(/token=([^\s]+)/);
  if (!match) throw new Error('No approval token found in the sent email');
  return match[1];
};

beforeEach(() => {
  sendEmail.mockReset();
  sendEmail.mockResolvedValue(undefined);
});

const registerUser = async (overrides: Record<string, unknown> = {}) =>
  request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: `${Date.now()}-${Math.random()}@example.com`,
      password: 'password123',
      ...overrides,
    });

describe('POST /api/auth/register', () => {
  it('rejects a request missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User' });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    const email = 'duplicate@example.com';
    await registerUser({ email });

    const res = await registerUser({ email });

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/already in use/i);
  });

  it('creates a user pending approval, emails the admin, and does not log them in', async () => {
    const res = await registerUser({
      name: 'Alice',
      email: 'alice@example.com',
    });

    expect(res.status).toBe(201);
    expect(res.body.pending).toBe(true);
    expect(res.headers['set-cookie']).toBeUndefined();

    const stored = await User.findOne({ email: 'alice@example.com' });
    expect(stored?.isApproved).toBe(false);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const emailArgs = sendEmail.mock.calls[0][0];
    expect(emailArgs.to).toBe(process.env.ADMIN_EMAIL);
    expect(emailArgs.text).toMatch(/approve\?token=/);
    expect(emailArgs.text).toMatch(/reject\?token=/);
  });

  it('still responds with the pending message even if the admin email fails to send', async () => {
    sendEmail.mockRejectedValue(new Error('SMTP down'));

    const res = await registerUser({
      name: 'Ivy',
      email: 'ivy@example.com',
    });

    expect(res.status).toBe(201);
    expect(res.body.pending).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  it('rejects a request missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@a.com' });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('rejects an incorrect password', async () => {
    await registerUser({
      email: 'bob@example.com',
      password: 'correct-password',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects login for a registered but not-yet-approved account', async () => {
    await registerUser({
      email: 'carol@example.com',
      password: 'correct-password',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'correct-password' });

    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials and never returns the password', async () => {
    await registerUser({
      email: 'carol@example.com',
      password: 'correct-password',
    });
    await User.updateOne({ email: 'carol@example.com' }, { isApproved: true });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^token=/);
    expect(res.body.user.password).toBeUndefined();
  });
});

describe('GET /api/auth/approve', () => {
  it('rejects a missing or invalid token', async () => {
    const res = await request(app).get('/api/auth/approve');
    expect(res.status).toBe(400);

    const invalidRes = await request(app)
      .get('/api/auth/approve')
      .query({ token: 'not-a-real-token' });
    expect(invalidRes.status).toBe(400);
  });

  it('approves the pending registration from the emailed link', async () => {
    await registerUser({ name: 'Zoe', email: 'zoe@example.com' });
    const token = extractApprovalTokenFromLastEmail();

    const res = await request(app).get('/api/auth/approve').query({ token });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Zoe/);

    const stored = await User.findOne({ email: 'zoe@example.com' });
    expect(stored?.isApproved).toBe(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zoe@example.com', password: 'password123' });
    expect(loginRes.status).toBe(200);
  });
});

describe('GET /api/auth/reject', () => {
  it('rejects a missing or invalid token', async () => {
    const res = await request(app).get('/api/auth/reject');
    expect(res.status).toBe(400);
  });

  it('deletes the pending registration from the emailed link', async () => {
    await registerUser({ name: 'Yara', email: 'yara@example.com' });
    const token = extractApprovalTokenFromLastEmail();

    const res = await request(app).get('/api/auth/reject').query({ token });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Yara/);
    expect(await User.findOne({ email: 'yara@example.com' })).toBeNull();
  });

  it('does not delete an account that has already been approved', async () => {
    await registerUser({ name: 'Xander', email: 'xander@example.com' });
    const token = extractApprovalTokenFromLastEmail();
    await request(app).get('/api/auth/approve').query({ token });

    const res = await request(app).get('/api/auth/reject').query({ token });

    expect(res.status).toBe(200);
    const stored = await User.findOne({ email: 'xander@example.com' });
    expect(stored).not.toBeNull();
    expect(stored?.isApproved).toBe(true);
  });
});

describe('protected auth routes without a valid session', () => {
  it('rejects getCurrentUser without a cookie', async () => {
    const res = await request(app).get('/api/auth/getCurrentUser');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/getCurrentUser')
      .set('Cookie', ['token=not-a-valid-jwt']);

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/getCurrentUser', () => {
  it('returns the user for the authenticated session', async () => {
    const user = await User.create({
      name: 'Dana',
      email: 'dana@example.com',
      password: 'password123',
    });
    const token = signToken(user._id.toString());

    const res = await request(app)
      .get('/api/auth/getCurrentUser')
      .set('Cookie', [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Dana',
      email: 'dana@example.com',
    });
  });
});

describe('PATCH /api/auth/updateUser', () => {
  it('rejects a request missing required fields', async () => {
    const user = await User.create({
      name: 'Eve',
      email: 'eve@example.com',
      password: 'password123',
    });
    const token = signToken(user._id.toString());

    const res = await request(app)
      .patch('/api/auth/updateUser')
      .set('Cookie', [`token=${token}`])
      .send({ name: 'Eve Updated' });

    expect(res.status).toBe(400);
  });

  it('updates the user and issues a fresh token', async () => {
    const user = await User.create({
      name: 'Frank',
      email: 'frank@example.com',
      password: 'password123',
    });
    const token = signToken(user._id.toString());

    const res = await request(app)
      .patch('/api/auth/updateUser')
      .set('Cookie', [`token=${token}`])
      .send({
        name: 'Frank Updated',
        email: 'frank-updated@example.com',
        team: 'Union Berlin',
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Frank Updated',
      email: 'frank-updated@example.com',
      team: 'Union Berlin',
    });
    expect(res.headers['set-cookie']?.[0]).toMatch(/^token=/);
  });

  it('persists emailRemindersEnabled when provided', async () => {
    const user = await User.create({
      name: 'Ida',
      email: 'ida@example.com',
      password: 'password123',
    });
    const token = signToken(user._id.toString());

    const res = await request(app)
      .patch('/api/auth/updateUser')
      .set('Cookie', [`token=${token}`])
      .send({
        name: 'Ida',
        email: 'ida@example.com',
        team: 'Union Berlin',
        emailRemindersEnabled: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ emailRemindersEnabled: false });
  });

  it('rejects with 401 instead of crashing when the account no longer exists', async () => {
    const user = await User.create({
      name: 'Grace',
      email: 'grace@example.com',
      password: 'password123',
    });
    const token = signToken(user._id.toString());
    await User.deleteOne({ _id: user._id });

    const res = await request(app)
      .patch('/api/auth/updateUser')
      .set('Cookie', [`token=${token}`])
      .send({
        name: 'Grace',
        email: 'grace@example.com',
        team: 'Union Berlin',
      });

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/auth/updatePassword', () => {
  it('rejects requests without a valid auth cookie', async () => {
    const res = await request(app)
      .patch('/api/auth/updatePassword')
      .send({ oldPassword: 'password123', newPassword: 'new-password123' });

    expect(res.status).toBe(401);
  });

  it('rejects a request missing required fields', async () => {
    const user = await User.create({
      name: 'Mona',
      email: 'mona@example.com',
      password: 'password123',
    });
    const token = signToken(user._id.toString());

    const res = await request(app)
      .patch('/api/auth/updatePassword')
      .set('Cookie', [`token=${token}`])
      .send({ oldPassword: 'password123' });

    expect(res.status).toBe(400);
  });

  it('rejects an incorrect current password without logging the user out', async () => {
    const user = await User.create({
      name: 'Nina',
      email: 'nina@example.com',
      password: 'password123',
    });
    const token = signToken(user._id.toString());

    const res = await request(app)
      .patch('/api/auth/updatePassword')
      .set('Cookie', [`token=${token}`])
      .send({ oldPassword: 'wrong-password', newPassword: 'new-password123' });

    expect(res.status).toBe(400);
  });

  it('rejects a new password that is too short', async () => {
    const user = await User.create({
      name: 'Oscar',
      email: 'oscar@example.com',
      password: 'password123',
    });
    const token = signToken(user._id.toString());

    const res = await request(app)
      .patch('/api/auth/updatePassword')
      .set('Cookie', [`token=${token}`])
      .send({ oldPassword: 'password123', newPassword: 'short' });

    expect(res.status).toBe(400);
  });

  it('updates the password and issues a fresh token', async () => {
    const user = await User.create({
      name: 'Paula',
      email: 'paula@example.com',
      password: 'old-password123',
    });
    const token = signToken(user._id.toString());

    const res = await request(app)
      .patch('/api/auth/updatePassword')
      .set('Cookie', [`token=${token}`])
      .send({
        oldPassword: 'old-password123',
        newPassword: 'new-password123',
      });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^token=/);

    const updated = await User.findById(user._id).select('+password');
    expect(await updated?.comparePassword('old-password123')).toBe(false);
    expect(await updated?.comparePassword('new-password123')).toBe(true);
  });

  it('rejects with 401 instead of crashing when the account no longer exists', async () => {
    const user = await User.create({
      name: 'Quinn',
      email: 'quinn@example.com',
      password: 'password123',
    });
    const token = signToken(user._id.toString());
    await User.deleteOne({ _id: user._id });

    const res = await request(app)
      .patch('/api/auth/updatePassword')
      .set('Cookie', [`token=${token}`])
      .send({ oldPassword: 'password123', newPassword: 'new-password123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/getAllUsers', () => {
  it('rejects requests without a valid auth cookie', async () => {
    const res = await request(app).get('/api/auth/getAllUsers');
    expect(res.status).toBe(401);
  });

  it('only exposes the name of other users, not their email/team', async () => {
    const requester = await User.create({
      name: 'Heidi',
      email: 'heidi@example.com',
      password: 'password123',
    });
    await User.create({
      name: 'Ivan',
      email: 'ivan@example.com',
      password: 'password123',
      team: 'Bayern',
    });
    const token = signToken(requester._id.toString());

    const res = await request(app)
      .get('/api/auth/getAllUsers')
      .set('Cookie', [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    for (const user of res.body.users) {
      expect(Object.keys(user).sort()).toEqual(['_id', 'name']);
    }
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('rejects a request missing the email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });

  it('returns the same generic response for an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.msg).toMatch(/if an account/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('emails a reset link for a known email and persists a hashed token', async () => {
    const user = await User.create({
      name: 'Judy',
      email: 'judy@example.com',
      password: 'password123',
    });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'judy@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.resetToken).toBeUndefined();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const emailArgs = sendEmail.mock.calls[0][0];
    expect(emailArgs.to).toBe('judy@example.com');
    expect(emailArgs.text).toMatch(/reset-password\?token=/);

    const resetToken = extractResetTokenFromLastEmail();
    const stored = await User.findById(user._id).select(
      '+passwordResetToken +passwordResetExpires'
    );
    expect(stored?.passwordResetToken).toBeDefined();
    // the DB stores a SHA-256 hash, never the plaintext token from the email
    expect(stored?.passwordResetToken).not.toBe(resetToken);
    expect(stored?.passwordResetExpires?.getTime()).toBeGreaterThan(Date.now());
  });

  it('still responds generically even if sending the email fails', async () => {
    await User.create({
      name: 'Mallory',
      email: 'mallory@example.com',
      password: 'password123',
    });
    sendEmail.mockRejectedValue(new Error('SMTP down'));

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'mallory@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.msg).toMatch(/if an account/i);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('rejects a request missing token or password', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'abc' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'new-password123' });
    expect(res.status).toBe(400);
  });

  it('rejects an expired token', async () => {
    const user = await User.create({
      name: 'Karl',
      email: 'karl@example.com',
      password: 'password123',
    });
    const resetToken = user.createPasswordResetToken();
    user.passwordResetExpires = new Date(Date.now() - 1000);
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'new-password123' });

    expect(res.status).toBe(400);
  });

  it('resets the password, logs the user in, and invalidates the token', async () => {
    const user = await User.create({
      name: 'Laura',
      email: 'laura@example.com',
      password: 'old-password123',
    });

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'laura@example.com' });
    const resetToken = extractResetTokenFromLastEmail();

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'new-password123' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.headers['set-cookie']?.[0]).toMatch(/^token=/);
    expect(resetRes.body.user.password).toBeUndefined();

    const reusedRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, password: 'another-password123' });
    expect(reusedRes.status).toBe(400);

    // checked directly against the model rather than via /login, which shares
    // a rate-limit counter with the register/login tests above
    const updated = await User.findById(user._id).select('+password');
    expect(await updated?.comparePassword('old-password123')).toBe(false);
    expect(await updated?.comparePassword('new-password123')).toBe(true);
  });
});

describe('GET /api/auth/logout', () => {
  it('clears the auth cookie', async () => {
    const res = await request(app).get('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^token=logout/);
  });
});
