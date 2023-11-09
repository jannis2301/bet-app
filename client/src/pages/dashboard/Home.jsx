import moment from 'moment'
import teamSanitization from '../../utils/teamSanitize'
import { useAppContext } from '../../context/appContext'
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi'

const Home = () => {
  const { bundesligaMatches, bundesligaMatchday, fetchBundesligaMatches } =
    useAppContext()

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
        <h1>{bundesligaMatchday}. Spieltag</h1>
        <button
          className="next-btn"
          onClick={() => fetchBundesligaMatches(bundesligaMatchday + 1)}
        >
          <p>nächster Spieltag</p>
          <HiArrowSmRight />
        </button>
      </div>
      <ul className="matches-box">
        {bundesligaMatches.map((match) => {
          const {
            matchID: id,
            team1,
            team2,
            matchResults,
            matchIsFinished,
            matchDateTime,
          } = match

          const matchDate = moment.utc(matchDateTime).local().format('D/M/YYYY')
          const matchTime = moment.utc(matchDateTime).local().format('H:mm')

          teamSanitization(team1, team2)

          return (
            <li className="game-box" key={id}>
              <span className="home-team">
                <p>{team1.shortName}</p>
                <img
                  className="club-icon"
                  src={team1.teamIconUrl}
                  alt={`${team1.shortName}-icon`}
                />
              </span>
              <span
                className={matchIsFinished ? 'score' : 'score not-finished'}
              >
                {matchResults.length ? (
                  `${matchResults[1].pointsTeam1}:${matchResults[1].pointsTeam2}`
                ) : (
                  <span className="match-date">
                    {matchDate} <br />
                    {matchTime}
                  </span>
                )}
              </span>
              <span className="away-team">
                <img
                  className="club-icon"
                  src={team2.teamIconUrl}
                  alt={`${team2.shortName}-icon`}
                />
                <p>{team2.shortName}</p>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
export default Home
