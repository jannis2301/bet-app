import express from 'express';
import rateLimiter from 'express-rate-limit';
import { getMatches } from '../controllers/matchesController.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();

const apiLimiter = rateLimiter({
  // Max 100 Requests, try again in 15 Minutes — generous enough for normal
  // navigation (matchday paging) while still capping abuse
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:
    'Too many requests from this IP address, please try again after 15 minutes',
});

router.use(apiLimiter);

router.route('/').get(authenticateUser, getMatches);

export default router;
