import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppContext } from '../../context/appContext'
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi'
import teamSanitization from '../../utils/teamSanitize'

const UserBets = () => {
  const { userId } = useParams()
  const {
    getUserBets,
    allUsers,
    allBetsPlaced,
    bundesligaMatches,
    bundesligaMatchday,
    fetchBundesligaMatches,
  } = useAppContext()
  const [bets, setBets] = useState([])

  useEffect(() => {
    getUserBets(userId)
  }, [userId])

  useEffect(() => {
    const matchDayBets =
      allBetsPlaced &&
      allBetsPlaced.filter((bet) => bet.matchDay === bundesligaMatchday)
    setBets(matchDayBets)
  }, [allBetsPlaced, bundesligaMatchday])

  const selectedUser = allUsers && allUsers.find((user) => user._id === userId)
  let displayName = selectedUser ? selectedUser.name : ''

  // Check if the last character of the name is not 's'
  if (displayName && displayName.charAt(displayName.length - 1) !== 's') {
    displayName += 's'
  }

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
        <h1>
          {displayName} Tipps für den {bundesligaMatchday}. Spieltag
        </h1>
        <button
          className="next-btn"
          onClick={() => fetchBundesligaMatches(bundesligaMatchday + 1)}
        >
          <p>nächster Spieltag</p>
          <HiArrowSmRight />
        </button>
      </div>
      <div className="matches-box">
        {bundesligaMatches &&
          bundesligaMatches.map((match) => {
            const { matchID, team1, team2 } = match
            teamSanitization(team1, team2)
            const matchesHaveFinished = bundesligaMatches.every(
              (match) => match.matchIsFinished === true
            )

            const correspondingBet =
              bets && bets.find((bet) => bet.matchID === matchID)
            const { homeScore, awayScore, pointsEarned } =
              correspondingBet || []

            return (
              <div
                className={`game-box ${
                  matchesHaveFinished ? 'points-earned' : ''
                }`}
                key={matchID}
              >
                <span className="home-team">
                  <p>{team1.shortName}</p>
                  <img
                    crossorigin="anonymous"
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
                    crossorigin="anonymous"
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

export default UserBets
