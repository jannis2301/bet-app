const mongoose = require('mongoose')

const betSchema = new mongoose.Schema(
  {
    matchDay: { type: Number, required: [true, 'Please provide matchday'] },
    matchID: { type: Number, required: [true, 'Please provide matchID'] },
    homeScore: {
      type: Number,
      required: [true, 'Please provide a score'],
      min: 0,
    },
    awayScore: {
      type: Number,
      required: [true, 'Please provide a score'],
      min: 0,
    },
    actualHomeScore: { type: Number },
    actualAwayScore: { type: Number },
    pointsEarned: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
  },
  { timestamps: true }
)

const Bets = mongoose.model('Bets', betSchema)

module.exports = Bets
