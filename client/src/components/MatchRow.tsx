import type { ReactNode } from 'react';
import type { Team } from '../types';
import teamSanitization from '../utils/teamSanitize';
import MatchTeam from './MatchTeam';

interface MatchRowProps {
  team1: Team;
  team2: Team;
  children: ReactNode;
}

// team1/team2 are mutated in place by teamSanitization (swaps blocked icon
// URLs for a local asset) — same as every call site did before this was
// extracted, see utils/teamSanitize.ts
const MatchRow = ({ team1, team2, children }: MatchRowProps) => {
  teamSanitization(team1, team2);

  return (
    <>
      <MatchTeam team={team1} side="home" />
      {children}
      <MatchTeam team={team2} side="away" />
    </>
  );
};

export default MatchRow;
