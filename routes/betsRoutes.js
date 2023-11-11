const express = require('express')
const router = express.Router()

const { setUserBets, getUserBets } = require('../controllers/betsController')

router.route('/').post(setUserBets)
router.route('/:userId').get(getUserBets)

module.exports = router
