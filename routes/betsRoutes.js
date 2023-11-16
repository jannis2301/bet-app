const express = require('express')
const router = express.Router()

const {
  setUserBets,
  getUserBets,
  getLeaderboard,
} = require('../controllers/betsController')
const authenticateUser = require('../middleware/auth')

router.route('/user/:userId').post(authenticateUser, setUserBets)
router.route('/user/:userId').get(getUserBets)
router.route('/leaderboard/:matchday').get(getLeaderboard)

module.exports = router
