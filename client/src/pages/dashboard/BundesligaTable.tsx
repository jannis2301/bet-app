import { useEffect } from 'react';
import { useAppContext } from '../../context/appContext';
import { tableSanitization } from '../../utils/teamSanitize';

const BundesligaTable = () => {
  const { bundesligaTable, bundesligaTableSeason, getBundesligaTable } =
    useAppContext();

  useEffect(() => {
    getBundesligaTable();
  }, [getBundesligaTable]);

  const isAvailable = bundesligaTable && bundesligaTable.length > 0;

  tableSanitization(bundesligaTable);

  return (
    <section className="leaderboard-box">
      <div className="matchday-headline">
        <h1>
          Bundesliga-Tabelle
          {bundesligaTableSeason &&
            ` Saison ${bundesligaTableSeason}/${Number(bundesligaTableSeason) + 1}`}
        </h1>
      </div>
      {isAvailable ? (
        <table className="bundesliga-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Sp</th>
              <th>S</th>
              <th>U</th>
              <th>N</th>
              <th>Tore</th>
              <th>Diff</th>
              <th>Pkt</th>
            </tr>
          </thead>
          <tbody>
            {bundesligaTable.map((team, index) => (
              <tr key={team.teamInfoId}>
                <td className="ranking">{index + 1}</td>
                <td className="team-cell">
                  <img
                    crossOrigin="anonymous"
                    className="club-icon"
                    src={team.teamIconUrl}
                    alt={`${team.shortName}-icon`}
                  />
                  <span>{team.teamName}</span>
                </td>
                <td>{team.matches}</td>
                <td>{team.won}</td>
                <td>{team.draw}</td>
                <td>{team.lost}</td>
                <td>
                  {team.goals}:{team.opponentGoals}
                </td>
                <td>{team.goalDiff}</td>
                <td>
                  <strong>{team.points}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Keine Tabelle verfügbar</p>
      )}
    </section>
  );
};

export default BundesligaTable;
