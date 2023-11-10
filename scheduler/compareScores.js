const Bets = require('../models/Bets')
const { fetchBundesligaMatches } = require('../utils/fetchMatches')

const compareScores = async () => {
  try {
    const { matchData: matches, matchdayToFetch: matchday } =
      await fetchBundesligaMatches()
    // Fetch all bets from the database
    const matchdayBets = await Bets.find({ matchDay: matchday })

    const allMatchesHaveFinished = matches?.every(
      (match) => match.matchIsFinished
    )

    if (!allMatchesHaveFinished) return

    for (const bet of matchdayBets) {
      const correspondingMatch = matches?.find(
        (match) => match.matchID === bet.matchID
      )

      if (correspondingMatch) {
        const { pointsTeam1: homeScore, pointsTeam2: awayScore } =
          correspondingMatch.matchResults[1]

        const exactScore =
          bet.homeScore === homeScore && bet.awayScore === awayScore

        const predictedWinning =
          bet.homeScore > bet.awayScore
            ? 'home'
            : bet.homeScore < bet.awayScore
            ? 'away'
            : 'draw'
        const actualWinning =
          homeScore > awayScore
            ? 'home'
            : homeScore < awayScore
            ? 'away'
            : 'draw'

        let pointsEarned = 0
        switch (true) {
          case exactScore:
            pointsEarned = 3
            break
          case predictedWinning === actualWinning:
            pointsEarned = 1
            break
          default:
            pointsEarned = 0
        }

        // Update the pointsEarned field for the current bet
        await Bets.updateOne({ _id: bet._id }, { $set: { pointsEarned } })
      }
    }
  } catch (error) {
    console.error(error)
  }
}

module.exports = { compareScores }
