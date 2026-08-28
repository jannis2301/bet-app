import type { Response } from 'express';

const attachCookies = ({
  res,
  token,
}: {
  res: Response;
  token: string;
}): void => {
  // one day in ms
  const oneDay = 1000 * 60 * 60 * 24;

  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

export default attachCookies;
