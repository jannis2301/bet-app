const Bets = require('../models/Bets')
const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError } = require('../errors/index')

exports.setUserBets = async (req, res) => {
  const bets = req.body
  for (const bet of bets) {
    const { matchID, matchDay, homeScore, awayScore } = bet
    if (!matchID || !matchDay || !homeScore || !awayScore) {
      throw new BadRequestError('Please Provide All Values')
    }
    await Bets.create(bet)
  }
  res.status(StatusCodes.CREATED).json(bets)
}

exports.getUserBets = async (req, res) => {
  const userId = req.params.userId
  try {
    const userBets = await Bets.find({ createdBy: userId })
    res.status(StatusCodes.OK).json({ userBets })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message })
  }
}

exports.getLeaderboard = async (req, res) => {
  const matchday = req.params.matchday

  try {
    const leaderboard = await Bets.aggregate([
      { $match: { matchDay: parseInt(matchday) } }, // Match specific matchday
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
        const user = await User.findById(leader._id)
        return {
          _id: leader._id,
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
