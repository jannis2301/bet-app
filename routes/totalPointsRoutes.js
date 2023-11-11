const express = require('express')
const router = express.Router()

const { getTotalPoints } = require('../controllers/totalPointsController')

router.route('/:matchday').get(getTotalPoints)

module.exports = router
