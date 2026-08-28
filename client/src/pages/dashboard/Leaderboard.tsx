import { useEffect, useState } from 'react';
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi';
import { useAppContext } from '../../context/appContext';
import type { LeaderboardEntry } from '../../types';

const VIEW_MATCHDAY = 'matchday';
const VIEW_SEASON = 'season';

const LeaderboardTable = ({ entries }: { entries: LeaderboardEntry[] }) => {
  const isAvailable = entries && entries.length > 0;

  if (!isAvailable) {
    return (
      <div>
        <p>Keine Tabelle verfügbar</p>
      </div>
    );
  }

  return (
    <table className="leaderboard-table">
      <thead>
        <tr>
          <th>#</th>
          <th>User</th>
          <th>Points</th>
          <th title="Exakte Ergebnisse — entscheidet bei Punktgleichstand">
            Exakt
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((user, index) => {
          const { _id, name, totalPoints, exactHits } = user;
          return (
            <tr key={_id}>
              <td className="ranking">{index + 1}</td>
              <td>{name}</td>
              <td>{totalPoints}</td>
              <td>{exactHits}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

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
          <div className="matchday-headline">
            <button
              type="button"
              className="prev-btn"
              onClick={() =>
                fetchBundesligaMatches(Number(bundesligaMatchday) - 1)
              }
              disabled={isLoading}
            >
              <HiArrowSmLeft />
              <p>vorheriger Spieltag</p>
            </button>
            <h1>Tabelle {bundesligaMatchday}. Spieltag</h1>
            <button
              type="button"
              className="next-btn"
              onClick={() =>
                fetchBundesligaMatches(Number(bundesligaMatchday) + 1)
              }
              disabled={isLoading}
            >
              <p>nächster Spieltag</p>
              <HiArrowSmRight />
            </button>
          </div>
          <LeaderboardTable entries={leaderboard} />
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
          <LeaderboardTable entries={seasonLeaderboard} />
        </>
      )}
    </section>
  );
};
export default Leaderboard;
