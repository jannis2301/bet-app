import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/appContext';

const PastSeasons = () => {
  const {
    archivedSeasons,
    selectedSeasonArchive,
    getArchivedSeasons,
    getSeasonArchive,
    isLoading,
  } = useAppContext();
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  useEffect(() => {
    getArchivedSeasons();
  }, [getArchivedSeasons]);

  const toggleSeason = (season: number) => {
    if (expandedSeason === season) {
      setExpandedSeason(null);
      return;
    }
    setExpandedSeason(season);
    getSeasonArchive(season);
  };

  return (
    <section className="leaderboard-box">
      <h1>Vergangene Saisons</h1>
      {archivedSeasons.length === 0 && !isLoading && (
        <p>Es sind noch keine Saisons archiviert.</p>
      )}
      <ul className="past-seasons-list">
        {archivedSeasons.map(({ season, entryCount }) => (
          <li key={season} className="past-season-item">
            <div className="past-season-headline">
              <h2>
                Saison {season}/{season + 1}
              </h2>
              <div className="past-season-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => toggleSeason(season)}
                >
                  {expandedSeason === season
                    ? 'Tabelle ausblenden'
                    : 'Tabelle anzeigen'}
                </button>
                <a
                  className="btn"
                  href={`/api/archive/${season}/pdf`}
                  download={`saison-${season}-${season + 1}-endtabelle.pdf`}
                >
                  PDF herunterladen
                </a>
              </div>
            </div>
            {entryCount === 0 && <p>Keine Tipps in dieser Saison.</p>}
            {expandedSeason === season &&
              selectedSeasonArchive?.season === season && (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Punkte</th>
                      <th>Exakt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSeasonArchive.leaderboard.map((entry, index) => (
                      <tr
                        key={`${entry.name}-${entry.totalPoints}-${entry.exactHits}`}
                      >
                        <td className="ranking">{index + 1}</td>
                        <td>{entry.name}</td>
                        <td>{entry.totalPoints}</td>
                        <td>{entry.exactHits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PastSeasons;
