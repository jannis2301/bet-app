import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnAuthenticatedError } from '../errors/index.js';

const auth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.token;
  if (!token) {
    throw new UnAuthenticatedError('Authentication Invalid');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };
    req.user = { userId: payload.userId };
    next();
  } catch (_error) {
    throw new UnAuthenticatedError('Authentication Invalid');
  }
};

export default auth;
