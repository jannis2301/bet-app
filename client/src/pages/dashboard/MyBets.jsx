import { useEffect, useState } from 'react'
import { useAppContext } from '../../context/appContext'
import teamSanitization from '../../utils/teamSanitize'
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi'

const MyBets = () => {
  const {
    user,
    getUserBets,
    allBetsPlaced,
    bundesligaMatches,
    bundesligaMatchday,
    fetchBundesligaMatches,
  } = useAppContext()
  const [bets, setBets] = useState([])

  useEffect(() => {
    getUserBets(user._id)
  }, [])

  useEffect(() => {
    const matchDayBets = allBetsPlaced.filter(
      (bet) => bet.matchDay === bundesligaMatchday
    )
    setBets(matchDayBets)
  }, [allBetsPlaced, bundesligaMatchday])

  return (
    <section>
      <div className="matchday-headline">
        <button
          className="prev-btn"
          onClick={() => fetchBundesligaMatches(bundesligaMatchday - 1)}
        >
          <HiArrowSmLeft />
          <p>vorheriger Spieltag</p>
        </button>
        <h1>Deine Tipps für den {bundesligaMatchday}. Spieltag</h1>
        <button
          className="next-btn"
          onClick={() => fetchBundesligaMatches(bundesligaMatchday + 1)}
        >
          <p>nächster Spieltag</p>
          <HiArrowSmRight />
        </button>
      </div>
      <div className="matches-box">
        {bundesligaMatches.map((match) => {
          const { matchID, team1, team2 } = match
          teamSanitization(team1, team2)
          const matchesHaveFinished = bundesligaMatches.every(
            (match) => match.matchIsFinished === true
          )

          const correspondingBet = bets.find((bet) => bet.matchID === matchID)
          const { homeScore, awayScore, pointsEarned } = correspondingBet || {}

          return (
            <div
              className="game-box"
              style={{
                gridTemplateColumns: '5fr 1fr 4fr 1fr',
                alignItems: 'center',
              }}
              key={matchID}
            >
              <span className="home-team">
                <p>{team1.shortName}</p>
                <img
                  className="club-icon"
                  src={team1.teamIconUrl}
                  alt={`${team1.shortName}-icon`}
                />
              </span>

              <span className="score">
                {homeScore ?? ''}:{awayScore ?? ''}
              </span>

              <span className="away-team">
                <img
                  className="club-icon"
                  src={team2.teamIconUrl}
                  alt={`${team2.shortName}-icon`}
                />
                <p>{team2.shortName}</p>
              </span>

              {pointsEarned !== undefined && matchesHaveFinished && (
                <p
                  style={{
                    color:
                      pointsEarned === 3
                        ? 'green'
                        : pointsEarned === 1
                        ? 'yellow'
                        : 'red',
                  }}
                >
                  {pointsEarned > 0 ? `+${pointsEarned}` : pointsEarned}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default MyBets
