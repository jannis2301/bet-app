import { useEffect, useState } from 'react';
import { MatchdayHeadline, RankingTable } from '../../components';
import { useAppContext } from '../../context/appContext';
import type { LeaderboardEntry } from '../../types';

const VIEW_MATCHDAY = 'matchday';
const VIEW_SEASON = 'season';

const toRankingEntries = (entries: LeaderboardEntry[]) =>
  entries.map(({ _id, name, totalPoints, exactHits }) => ({
    key: _id,
    name,
    totalPoints,
    exactHits,
  }));

const Leaderboard = () => {
  const {
    leaderboard,
    seasonLeaderboard,
    seasonLeaderboardYear,
    bundesligaMatchday,
    fetchBundesligaMatches,
    getLeaderboard,
    getSeasonLeaderboard,
    isLoading,
  } = useAppContext();

  const [view, setView] = useState(VIEW_MATCHDAY);

  useEffect(() => {
    fetchBundesligaMatches(bundesligaMatchday);
    getLeaderboard(bundesligaMatchday);
  }, [bundesligaMatchday, fetchBundesligaMatches, getLeaderboard]);

  useEffect(() => {
    if (view === VIEW_SEASON) {
      getSeasonLeaderboard();
    }
  }, [view, getSeasonLeaderboard]);

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
