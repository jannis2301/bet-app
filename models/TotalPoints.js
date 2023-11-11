const mongoose = require('mongoose')

const totalPointsSchema = new mongoose.Schema(
  {
    userId: String,
    name: String,
    totalPoints: Number,
    matchday: Number,
  },
  { timestamps: true }
)

const TotalPoints = mongoose.model('TotalPoints', totalPointsSchema)

module.exports = TotalPoints
