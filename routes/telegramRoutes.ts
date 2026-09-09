import express from 'express';
import rateLimiter from 'express-rate-limit';
import {
  getLinkToken,
  telegramWebhook,
} from '../controllers/telegramController.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();

// the limiters below share one counter per instance across every test in a
// file (no per-test reset), so a growing test suite easily runs past a
// max of 10 — the actual limit only matters in production
const skipInTest = () => process.env.NODE_ENV === 'test';

// own counter — a user retrying the link flow shouldn't be affected by
// Telegram's own webhook traffic, and vice versa
const linkTokenLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  // an object (not a string) so express-rate-limit's res.send() serializes
  // it as JSON — the frontend's error parser reads error.response.data.msg
  // and got nothing usable from a plain-text body
  message: {
    msg: 'Too many requests from this IP address, please try again after 15 minutes',
  },
  skip: skipInTest,
});

router
  .route('/link-token')
  .get(linkTokenLimiter, authenticateUser, getLinkToken);
router.route('/webhook').post(telegramWebhook);

export default router;
