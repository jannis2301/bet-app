const express = require('express')
const router = express.Router()

const {
  setUserBets,
  getUserBets,
  getLeaderboard,
} = require('../controllers/betsController')

router.route('/').post(setUserBets)
router.route('/:userId').get(getUserBets)
router.route('/leaderboard/:matchday').get(getLeaderboard)

module.exports = router
