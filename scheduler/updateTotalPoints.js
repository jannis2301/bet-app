const Bet = require('../models/Bet')
const User = require('../models/User')
const TotalPoints = require('../models/TotalPoints')
const { fetchBundesligaMatches } = require('../utils/fetchMatches')

const updateTotalPoints = async () => {
  try {
    const { matchdayToFetch: matchday, matchData: matches } =
      await fetchBundesligaMatches()
    const allMatchesHaveFinished = matches?.every(
      (match) => match.matchIsFinished
    )

    if (!allMatchesHaveFinished) return

    const totalPoints = await Bet.aggregate([
      { $match: { matchDay: parseInt(matchday) } },
      {
        $group: {
          _id: '$createdBy', // Group by the user who created the bet
          totalPoints: { $sum: '$pointsEarned' }, // Calculate total points
        },
      },
      { $sort: { totalPoints: -1 } }, // Sort in descending order of total points
    ])

    for (const points of totalPoints) {
      const { _id: id, totalPoints } = points
      const user = await User.findById(id)
      const { name } = user
      const newTotalPoints = {
        userId: id,
        name,
        totalPoints,
        matchday,
      }
      console.log(newTotalPoints)
      await TotalPoints.create(newTotalPoints)
    }
  } catch (error) {
    console.error(error)
  }
}

module.exports = { updateTotalPoints }
