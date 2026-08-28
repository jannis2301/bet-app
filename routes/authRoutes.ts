import express from 'express';
import rateLimiter from 'express-rate-limit';
import {
  forgotPassword,
  getAllUsers,
  getCurrentUser,
  login,
  logout,
  register,
  resetPassword,
  updatePassword,
  updateUser,
} from '../controllers/authController.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();

const apiLimiter = rateLimiter({
  // Max 10 Requests, try again in 15 Minutes
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    'Too many requests from this IP address, please try again after 15 minutes',
  //validate: { xForwardedForHeader: false },
});

// separate instance (own counter) so brute-forcing a reset token doesn't
// also lock a user out of /login, and vice versa
const passwordResetLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    'Too many requests from this IP address, please try again after 15 minutes',
});

router.route('/register').post(apiLimiter, register);
router.route('/login').post(apiLimiter, login);
router.route('/forgot-password').post(passwordResetLimiter, forgotPassword);
router.route('/reset-password').post(passwordResetLimiter, resetPassword);
router.route('/updateUser').patch(authenticateUser, updateUser);
router.route('/updatePassword').patch(authenticateUser, updatePassword);
router.route('/getCurrentUser').get(authenticateUser, getCurrentUser);
router.route('/getAllUsers').get(authenticateUser, getAllUsers);
router.route('/logout').get(logout);

export default router;
