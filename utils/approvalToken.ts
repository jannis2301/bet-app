import jwt from 'jsonwebtoken';

// long-lived since an admin might not check their inbox right away — this
// token only ever gates one specific pending registration, not general
// account access, so a generous lifetime is low-risk
const APPROVAL_TOKEN_LIFETIME = '30d';

interface ApprovalTokenPayload {
  userId: string;
}

export const signApprovalToken = (userId: string): string =>
  jwt.sign(
    { userId } satisfies ApprovalTokenPayload,
    process.env.JWT_SECRET as string,
    { expiresIn: APPROVAL_TOKEN_LIFETIME }
  );

export const verifyApprovalToken = (token: string): string | null => {
  try {
    const { userId } = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as ApprovalTokenPayload;
    return userId;
  } catch {
    return null;
  }
};
