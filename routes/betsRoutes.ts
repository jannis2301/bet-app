import express from 'express';
import rateLimiter from 'express-rate-limit';
import {
  getAllUserBetsByMatchday,
  getLeaderboard,
  getSeasonLeaderboard,
  setUserBets,
} from '../controllers/betsController.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();

const apiLimiter = rateLimiter({
  // Max 100 Requests, try again in 15 Minutes — generous enough for normal
  // navigation (matchday paging, tab switching) while still capping abuse
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:
    'Too many requests from this IP address, please try again after 15 minutes',
});

router.use(apiLimiter);

router.route('/user/:userId').post(authenticateUser, setUserBets);
router.route('/user/:matchday').get(authenticateUser, getAllUserBetsByMatchday);
router.route('/leaderboard/season').get(getSeasonLeaderboard);
router.route('/leaderboard/:matchday').get(getLeaderboard);

export default router;
