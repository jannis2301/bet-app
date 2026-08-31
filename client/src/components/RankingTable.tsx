export interface RankingEntry {
  key: string;
  name: string;
  totalPoints: number;
  exactHits: number;
}

interface RankingTableProps {
  entries: RankingEntry[];
}

const RankingTable = ({ entries }: RankingTableProps) => {
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
          <th>Punkte</th>
          <th title="Exakte Ergebnisse — entscheidet bei Punktgleichstand">
            Exakt
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <tr key={entry.key}>
            <td className="ranking">{index + 1}</td>
            <td>{entry.name}</td>
            <td>{entry.totalPoints}</td>
            <td>{entry.exactHits}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default RankingTable;
