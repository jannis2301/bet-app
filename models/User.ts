import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose, { Schema } from 'mongoose';
import validator from 'validator';

// how long a password reset token stays valid after being issued
const PASSWORD_RESET_TOKEN_LIFETIME_MS = 10 * 60 * 1000;

// how long a Telegram account-linking token stays valid after being issued
const TELEGRAM_LINK_TOKEN_LIFETIME_MS = 15 * 60 * 1000;

export interface IUser {
  name: string;
  email: string;
  password: string;
  team: string;
  isApproved: boolean;
  // opt-out for scheduler/matchdayReminder.ts's cron email
  emailRemindersEnabled: boolean;
  // set once the user links their Telegram account via
  // controllers/telegramController.ts's webhook; absent until then
  telegramChatId?: string;
  // opt-out for scheduler/matchdayReminder.ts's cron telegram message —
  // irrelevant until telegramChatId is set
  telegramRemindersEnabled: boolean;
  telegramLinkToken?: string;
  telegramLinkTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserMethods {
  createJWT(): string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  // hashes and stores a reset token on the document (caller must still save()),
  // returns the unhashed token to hand to the user
  createPasswordResetToken(): string;
  // same idea as createPasswordResetToken, but short enough (and restricted
  // to a safe charset) to survive Telegram's t.me/<bot>?start=<payload> deep
  // link, which caps the payload at 64 chars from [A-Za-z0-9_-]
  createTelegramLinkToken(): string;
}

type UserModel = mongoose.Model<IUser, Record<string, never>, IUserMethods>;

export type UserDocument = mongoose.HydratedDocument<IUser, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, 'Please provide name'],
      minlength: 3,
      maxlength: 20,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: 'Please provide a valid email',
      },
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 8,
      select: false,
    },
    team: {
      type: String,
      trim: true,
      maxlength: 30,
      default: 'my team',
    },
    // gates login until an admin approves the registration — see
    // controllers/authController.ts's register/login/approveUser/rejectUser
    isApproved: {
      type: Boolean,
      default: false,
    },
    emailRemindersEnabled: {
      type: Boolean,
      default: true,
    },
    telegramChatId: {
      type: String,
    },
    telegramRemindersEnabled: {
      type: Boolean,
      default: true,
    },
    telegramLinkToken: {
      type: String,
      select: false,
    },
    telegramLinkTokenExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.createJWT = function (): string {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET as string, {
    // jsonwebtoken rejects an explicit `expiresIn: undefined`, so an unset
    // JWT_LIFETIME must not be passed through as-is — fall back to render.yaml's default.
    expiresIn: (process.env.JWT_LIFETIME ||
      '1d') as jwt.SignOptions['expiresIn'],
  });
};

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

UserSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = randomBytes(32).toString('hex');
  this.passwordResetToken = createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_LIFETIME_MS
  );
  return resetToken;
};

UserSchema.methods.createTelegramLinkToken = function (): string {
  // hex (0-9a-f) is a subset of the charset Telegram allows in a deep-link
  // payload, and 32 chars comfortably clears its 64-char cap
  const linkToken = randomBytes(16).toString('hex');
  this.telegramLinkToken = createHash('sha256').update(linkToken).digest('hex');
  this.telegramLinkTokenExpires = new Date(
    Date.now() + TELEGRAM_LINK_TOKEN_LIFETIME_MS
  );
  return linkToken;
};

const User =
  (mongoose.models.User as UserModel) ||
  mongoose.model<IUser, UserModel>('User', UserSchema);

export default User;
