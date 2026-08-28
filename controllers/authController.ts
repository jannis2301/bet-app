import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, UnAuthenticatedError } from '../errors/index.js';
import User from '../models/User.js';
import attachCookies from '../utils/attachCookies.js';
// imported via namespace (not destructured) so tests can vi.spyOn the
// exported binding directly — see betsController.test.ts for the same pattern
import * as sendEmailModule from '../utils/sendEmail.js';

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new BadRequestError('please provide all values');
  }
  const userAlreadyExists = await User.findOne({ email });
  if (userAlreadyExists) {
    throw new BadRequestError('Email already in use');
  }
  const user = await User.create({ name, email, password });

  const token = user.createJWT();
  attachCookies({ res, token });
  res.status(StatusCodes.CREATED).json({
    user: {
      email: user.email,
      name: user.name,
      location: user.location,
      team: user.team,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError('Please provide all values');
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new UnAuthenticatedError('Invalid Credentials');
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnAuthenticatedError('Invalid Credentials');
  }
  const token = user.createJWT();
  user.password = undefined as unknown as string;
  attachCookies({ res, token });

  res.status(StatusCodes.OK).json({ user });
};

export const updateUser = async (req: Request, res: Response) => {
  const { email, name, location, team } = req.body;
  if (!email || !name || !location || !team) {
    throw new BadRequestError('Please provide all values');
  }
  const user = await User.findOne({ _id: req.user?.userId });
  if (!user) {
    throw new UnAuthenticatedError('Authentication Invalid');
  }

  user.email = email;
  user.name = name;
  user.location = location;
  user.team = team;

  await user.save();

  const token = user.createJWT();
  attachCookies({ res, token });

  res.status(StatusCodes.OK).json({ user });
};

export const updatePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new BadRequestError('Please provide the current and new password');
  }

  const user = await User.findOne({ _id: req.user?.userId }).select(
    '+password'
  );
  if (!user) {
    throw new UnAuthenticatedError('Authentication Invalid');
  }

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    // 400, not 401 — a wrong current password must not trip the frontend's
    // "log out on 401" interceptor while the user is still authenticated
    throw new BadRequestError('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  const token = user.createJWT();
  attachCookies({ res, token });

  res.status(StatusCodes.OK).json({ msg: 'Password updated successfully' });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.user?.userId });
  res.status(StatusCodes.OK).json({ user });
};

export const getAllUsers = async (_req: Request, res: Response) => {
  // Only the name is needed to label other users' bets in the UI — avoid
  // leaking every registered user's email/location/team to any logged-in user.
  const users = await User.find().select('name');
  res.status(StatusCodes.OK).json({ users });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new BadRequestError('Please provide an email');
  }

  const genericResponse = {
    msg: 'If an account with that email exists, a password reset link has been sent.',
  };

  const user = await User.findOne({ email });
  if (!user) {
    // same response as the success case, so a caller can't use this
    // endpoint to check which emails are registered
    res.status(StatusCodes.OK).json(genericResponse);
    return;
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Render sits behind a proxy that terminates TLS, so req.protocol would
  // report 'http' without also configuring `trust proxy` — NODE_ENV is a
  // simpler, already-established way to tell (see attachCookies.ts's
  // `secure` flag for the same pattern) since any real deployment is HTTPS.
  const protocol =
    process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
  const resetUrl = `${protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

  try {
    await sendEmailModule.sendEmail({
      to: user.email,
      subject: 'Passwort zurücksetzen',
      text: `Klicke auf folgenden Link, um dein Passwort zurückzusetzen (gültig für 10 Minuten): ${resetUrl}`,
      html: `<p>Klicke auf folgenden Link, um dein Passwort zurückzusetzen (gültig für 10 Minuten):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  } catch (error) {
    // never let a mail-provider failure leak whether the account exists, or
    // surface as a 500 — same generic response either way, just logged
    console.error(error);
  }

  res.status(StatusCodes.OK).json(genericResponse);
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) {
    throw new BadRequestError('Please provide the token and a new password');
  }

  const hashedToken = createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const jwtToken = user.createJWT();
  user.password = undefined as unknown as string;
  attachCookies({ res, token: jwtToken });

  res.status(StatusCodes.OK).json({ user });
};

export const logout = async (_req: Request, res: Response) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.status(StatusCodes.OK).json({ msg: 'user logged out' });
};
