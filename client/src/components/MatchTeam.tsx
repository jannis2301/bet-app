import type { Team } from '../types';

interface MatchTeamProps {
  team: Team;
  side: 'home' | 'away';
}

const MatchTeam = ({ team, side }: MatchTeamProps) => {
  const icon = (
    <img
      crossOrigin="anonymous"
      className="club-icon"
      src={team.teamIconUrl}
      alt={`${team.shortName}-icon`}
    />
  );
  const name = <p className="team-name">{team.shortName}</p>;

  return (
    <span className={`${side}-team`}>
      {side === 'home' ? (
        <>
          {name}
          {icon}
        </>
      ) : (
        <>
          {icon}
          {name}
        </>
      )}
    </span>
  );
};
export default MatchTeam;
