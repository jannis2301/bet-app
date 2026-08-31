import moment from 'moment';
import { useEffect } from 'react';
import { MatchdayHeadline, MatchRow } from '../../components';
import { useAppContext } from '../../context/appContext';

// How often to re-check for a new current matchday / updated scores while
// this page is open, so it doesn't stay stuck on a stale matchday.
const POLL_INTERVAL_MS = 5 * 60 * 1000;

const Matchday = () => {
  const {
    bundesligaMatches,
    bundesligaMatchday,
    currentMatchday,
    fetchBundesligaMatches,
    isLoading,
  } = useAppContext();

  useEffect(() => {
    fetchBundesligaMatches();
  }, [fetchBundesligaMatches]);

  // Only auto-refresh while viewing the current matchday — otherwise this
  // would yank the user back from a manually browsed past/future matchday.
  useEffect(() => {
    if (bundesligaMatchday !== currentMatchday) return;
    const intervalId = setInterval(() => {
      fetchBundesligaMatches();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [bundesligaMatchday, currentMatchday, fetchBundesligaMatches]);

  return (
    <section>
      <MatchdayHeadline
        isLoading={isLoading}
        onPrev={() => fetchBundesligaMatches(Number(bundesligaMatchday) - 1)}
        onNext={() => fetchBundesligaMatches(Number(bundesligaMatchday) + 1)}
      >
        {bundesligaMatchday}. Spieltag
      </MatchdayHeadline>
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

          return (
            <li className="game-box" key={id}>
              <MatchRow team1={team1} team2={team2}>
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
              </MatchRow>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
export default Matchday;
