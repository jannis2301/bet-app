import moment from 'moment';
import { useEffect } from 'react';
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi';
import { useAppContext } from '../../context/appContext';
import teamSanitization from '../../utils/teamSanitize';

const Home = () => {
  const {
    bundesligaMatches,
    bundesligaMatchday,
    fetchBundesligaMatches,
    isLoading,
  } = useAppContext();

  useEffect(() => {
    fetchBundesligaMatches();
  }, [fetchBundesligaMatches]);

  return (
    <section>
      <div className="matchday-headline">
        <button
          type="button"
          className="prev-btn"
          onClick={() => fetchBundesligaMatches(Number(bundesligaMatchday) - 1)}
          disabled={isLoading}
        >
          <HiArrowSmLeft />
          <p>vorheriger Spieltag</p>
        </button>
        <h1>{bundesligaMatchday}. Spieltag</h1>
        <button
          type="button"
          className="next-btn"
          onClick={() => fetchBundesligaMatches(Number(bundesligaMatchday) + 1)}
          disabled={isLoading}
        >
          <p>nächster Spieltag</p>
          <HiArrowSmRight />
        </button>
      </div>
      <ul className="matches-box">
        {bundesligaMatches?.map((match) => {
          const {
            matchID: id,
            team1,
            team2,
            matchResults,
            matchIsFinished,
            matchDateTimeUTC,
          } = match;

          // matchDateTime (without the UTC suffix) is already the naive
          // German kickoff time, not UTC — treating it as UTC and converting
          // to local double-shifts it by the timezone offset. matchDateTimeUTC
          // is the actual UTC instant, so only that one should go through
          // .utc().local().
          const matchDate = moment
            .utc(matchDateTimeUTC)
            .local()
            .format('D/M/YYYY');
          const matchTime = moment.utc(matchDateTimeUTC).local().format('H:mm');

          teamSanitization(team1, team2);

          return (
            <li className="game-box" key={id}>
              <span className="home-team">
                <p>{team1.shortName}</p>
                <img
                  crossOrigin="anonymous"
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
                  crossOrigin="anonymous"
                  className="club-icon"
                  src={team2.teamIconUrl}
                  alt={`${team2.shortName}-icon`}
                />
                <p>{team2.shortName}</p>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
export default Home;
