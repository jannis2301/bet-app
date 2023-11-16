const mongoose = require('mongoose')
const Bet = require('../models/Bet')
const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError } = require('../errors/index')
const ObjectId = mongoose.Types.ObjectId

exports.setUserBets = async (req, res) => {
  const bets = req.body
  for (const bet of bets) {
    const { matchID, matchDay, homeScore, awayScore } = bet
    if (!matchID || !matchDay || !homeScore || !awayScore) {
      throw new BadRequestError('Please Provide All Values')
    }

    const userId = new ObjectId(req.params.userId)
    await Bet.create({ ...bet, createdBy: userId })
  }
  res.status(StatusCodes.CREATED).json(bets)
}

exports.getUserBets = async (req, res) => {
  const userId = req.params.userId
  if (!ObjectId.isValid(userId))
    res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid userId' })

  try {
    const userBets = await Bet.find({ createdBy: new ObjectId(userId) })
    res.status(StatusCodes.OK).json({ userBets })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message })
  }
}

exports.getLeaderboard = async (req, res) => {
  const matchday = parseInt(req.params.matchday)
  if (!matchday) {
    return
  }
  try {
    const bets = await Bet.find({ matchDay: matchday })
    if (!bets || bets.length === 0)
      res
        .status(StatusCodes.OK)
        .json({ msg: `No bets have been placed for matchday ${matchday}!` })

    const leaderboard = await Bet.aggregate([
      { $match: { matchDay: matchday } }, // Match specific matchday
      {
        $group: {
          _id: '$createdBy', // Group by the user who created the bet
          totalPoints: { $sum: '$pointsEarned' }, // Calculate total points
        },
      },
      { $sort: { totalPoints: -1 } }, // Sort in descending order of total points
    ])

    // Get user details for each _id in the leaderboard
    const populatedLeaderboard = await Promise.all(
      leaderboard?.map(async (leader) => {
        if (!ObjectId.isValid(leader._id)) {
          // Handle invalid ObjectId, perhaps by logging or returning an error
          return null
        }

        const user = await User.findById(leader._id)
        return {
          _id: new ObjectId(leader._id),
          name: user.name, // Include the user's name
          totalPoints: leader.totalPoints,
        }
      })
    )

    res.status(StatusCodes.OK).json({ leaderboard: populatedLeaderboard })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message })
  }
}
