import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../../context/appContext';
import { useAppContext } from '../../context/appContext';
import type { Match } from '../../types';
import Matchday from './Matchday';

vi.mock('../../context/appContext', () => ({
  useAppContext: vi.fn(),
}));

// Kickoff display must be timezone-correct regardless of which timezone the
// test happens to run in (CI runners typically default to UTC).
process.env.TZ = 'Europe/Berlin';

const upcomingMatch: Match = {
  matchID: 1,
  team1: { teamId: 1, shortName: 'FCB', teamIconUrl: 'bayern.png' },
  team2: { teamId: 2, shortName: 'VfB', teamIconUrl: 'stuttgart.png' },
  matchResults: [],
  matchIsFinished: false,
  // Real openligadb shape: matchDateTime is the naive (already-local) German
  // kickoff time, matchDateTimeUTC is the same instant in true UTC.
  matchDateTime: '2025-08-22T20:30:00',
  matchDateTimeUTC: '2025-08-22T18:30:00Z',
  group: { groupOrderID: 1 },
};

describe('Matchday', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the real kickoff time (20:30 CEST), not a double-shifted one', () => {
    vi.mocked(useAppContext).mockReturnValue({
      bundesligaMatches: [upcomingMatch],
      bundesligaMatchday: 1,
      fetchBundesligaMatches: vi.fn(),
      isLoading: false,
    } as unknown as AppContextValue);

    render(<Matchday />);

    expect(screen.getByText(/20:30/)).toBeInTheDocument();
    expect(screen.queryByText(/22:30/)).not.toBeInTheDocument();
  });
});
