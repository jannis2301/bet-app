const express = require('express')
const router = express.Router()

const rateLimiter = require('express-rate-limit')

const apiLimiter = rateLimiter({
  // Max 10 Requests, try again in 15 Minutes
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    'Too many requests from this IP address, please try again after 15 minutes',
})

const {
  register,
  login,
  updateUser,
  getCurrentUser,
  logout,
  getAllUsers,
} = require('../controllers/authController')

const authenticateUser = require('../middleware/auth')
//const testUser = require('../middleware/testUser')

router.route('/register').post(apiLimiter, register)
router.route('/login').post(apiLimiter, login)
router.route('/updateUser').patch(authenticateUser, updateUser)
router.route('/getCurrentUser').get(authenticateUser, getCurrentUser)
router.route('/getAllUsers').get(getAllUsers)
router.route('/logout').get(logout)

module.exports = router
