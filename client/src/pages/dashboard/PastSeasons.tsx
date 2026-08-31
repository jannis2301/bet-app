import { useEffect, useState } from 'react';
import { RankingTable } from '../../components';
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
      <h1>Archiv</h1>
      {archivedSeasons.length === 0 && !isLoading && (
        <p>Es sind noch keine vergangenen Saisons archiviert.</p>
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
                <RankingTable
                  entries={selectedSeasonArchive.leaderboard.map((entry) => ({
                    key: `${entry.name}-${entry.totalPoints}-${entry.exactHits}`,
                    name: entry.name,
                    totalPoints: entry.totalPoints,
                    exactHits: entry.exactHits,
                  }))}
                />
              )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PastSeasons;
