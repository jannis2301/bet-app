const express = require('express');
const router = express.Router();

const {
  setUserBets,
  getLeaderboard,
  getAllUserBetsByMatchday,
} = require('../controllers/betsController');
const authenticateUser = require('../middleware/auth');

router.route('/user/:userId').post(authenticateUser, setUserBets);
router.route('/user/:matchday').get(getAllUserBetsByMatchday);
router.route('/leaderboard/:matchday').get(getLeaderboard);

module.exports = router;
