import moment from 'moment';
import { useEffect } from 'react';
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi';
import { MatchTeam } from '../../components';
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
              <MatchTeam team={team1} side="home" />
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
              <MatchTeam team={team2} side="away" />
            </li>
          );
        })}
      </ul>
    </section>
  );
};
export default Home;
