import express from 'express';
import rateLimiter from 'express-rate-limit';
import {
  approveUser,
  forgotPassword,
  getAllUsers,
  getCurrentUser,
  login,
  logout,
  register,
  rejectUser,
  resetPassword,
  updatePassword,
  updateUser,
} from '../controllers/authController.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();

// the limiters below share one counter per instance across every test in a
// file (no per-test reset), so a growing test suite easily runs past a
// max of 10 — the actual limit only matters in production
const skipInTest = () => process.env.NODE_ENV === 'test';

const apiLimiter = rateLimiter({
  // Max 10 Requests, try again in 15 Minutes
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    'Too many requests from this IP address, please try again after 15 minutes',
  skip: skipInTest,
  //validate: { xForwardedForHeader: false },
});

// separate instance (own counter) so brute-forcing a reset token doesn't
// also lock a user out of /login, and vice versa
const passwordResetLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    'Too many requests from this IP address, please try again after 15 minutes',
  skip: skipInTest,
});

// own counter, same reasoning — guessing an approval token shouldn't also
// lock the admin out of clicking a legitimate link
const approvalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    'Too many requests from this IP address, please try again after 15 minutes',
  skip: skipInTest,
});

router.route('/register').post(apiLimiter, register);
router.route('/login').post(apiLimiter, login);
router.route('/forgot-password').post(passwordResetLimiter, forgotPassword);
router.route('/reset-password').post(passwordResetLimiter, resetPassword);
router.route('/approve').get(approvalLimiter, approveUser);
router.route('/reject').get(approvalLimiter, rejectUser);
router.route('/updateUser').patch(authenticateUser, updateUser);
router.route('/updatePassword').patch(authenticateUser, updatePassword);
router.route('/getCurrentUser').get(authenticateUser, getCurrentUser);
router.route('/getAllUsers').get(authenticateUser, getAllUsers);
router.route('/logout').get(logout);

export default router;
