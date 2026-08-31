import { useEffect, useState } from 'react';
import { MatchdayHeadline, RankingTable } from '../../components';
import { useAppContext } from '../../context/appContext';
import type { LeaderboardEntry } from '../../types';

const VIEW_MATCHDAY = 'matchday';
const VIEW_SEASON = 'season';

// How often to re-check for updated points while this page is open, so it
// doesn't stay stuck on a stale ranking as bets get compared during live play.
const POLL_INTERVAL_MS = 5 * 60 * 1000;

const toRankingEntries = (entries: LeaderboardEntry[]) =>
  entries.map(({ _id, name, team, totalPoints, exactHits }) => ({
    key: _id,
    name,
    team,
    totalPoints,
    exactHits,
  }));

const Leaderboard = () => {
  const {
    leaderboard,
    seasonLeaderboard,
    seasonLeaderboardYear,
    bundesligaMatchday,
    currentMatchday,
    fetchBundesligaMatches,
    getLeaderboard,
    getSeasonLeaderboard,
    isLoading,
  } = useAppContext();

  const [view, setView] = useState(VIEW_MATCHDAY);

  useEffect(() => {
    fetchBundesligaMatches(bundesligaMatchday);
    // bundesligaMatchday starts out empty until the fetch above resolves and
    // populates it — the effect then reruns via the dependency below.
    if (!bundesligaMatchday) return;
    getLeaderboard(bundesligaMatchday);
  }, [bundesligaMatchday, fetchBundesligaMatches, getLeaderboard]);

  useEffect(() => {
    if (view === VIEW_SEASON) {
      getSeasonLeaderboard();
    }
  }, [view, getSeasonLeaderboard]);

  // Only auto-refresh the matchday tab while it's showing the current
  // matchday — otherwise this would yank the user back from a manually
  // browsed past/future matchday. The season tab has no such browsing state.
  useEffect(() => {
    if (view === VIEW_MATCHDAY && bundesligaMatchday !== currentMatchday) {
      return undefined;
    }
    const intervalId = setInterval(() => {
      if (view === VIEW_MATCHDAY) {
        fetchBundesligaMatches(bundesligaMatchday);
        if (!bundesligaMatchday) return;
        getLeaderboard(bundesligaMatchday);
      } else {
        getSeasonLeaderboard();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [
    view,
    bundesligaMatchday,
    currentMatchday,
    fetchBundesligaMatches,
    getLeaderboard,
    getSeasonLeaderboard,
  ]);

  return (
    <section className="leaderboard-box">
      <div className="leaderboard-tabs">
        <button
          type="button"
          className={view === VIEW_MATCHDAY ? 'active' : ''}
          onClick={() => setView(VIEW_MATCHDAY)}
        >
          Spieltag
        </button>
        <button
          type="button"
          className={view === VIEW_SEASON ? 'active' : ''}
          onClick={() => setView(VIEW_SEASON)}
        >
          Gesamt
        </button>
      </div>
      {view === VIEW_MATCHDAY ? (
        <>
          <MatchdayHeadline
            isLoading={isLoading}
            onPrev={() =>
              fetchBundesligaMatches(Number(bundesligaMatchday) - 1)
            }
            onNext={() =>
              fetchBundesligaMatches(Number(bundesligaMatchday) + 1)
            }
          >
            Tabelle {bundesligaMatchday}. Spieltag
          </MatchdayHeadline>
          <RankingTable entries={toRankingEntries(leaderboard)} />
        </>
      ) : (
        <>
          <div className="matchday-headline">
            <h1>
              Gesamttabelle
              {seasonLeaderboardYear &&
                ` Saison ${seasonLeaderboardYear}/${seasonLeaderboardYear + 1}`}
            </h1>
          </div>
          <RankingTable entries={toRankingEntries(seasonLeaderboard)} />
        </>
      )}
    </section>
  );
};
export default Leaderboard;
