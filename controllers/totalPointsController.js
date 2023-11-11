const TotalPoints = require('../models/TotalPoints')

exports.getTotalPoints = async (req, res) => {
  const matchday = req.params.matchday
  try {
    const totalPoints = await TotalPoints.find({ matchday })
    const leaderboard = await totalPoints.sort(
      (a, b) => b.totalPoints - a.totalPoints
    )

    res.status(200).json({ leaderboard })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message })
  }
}
