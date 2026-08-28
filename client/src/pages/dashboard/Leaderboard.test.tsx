import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../../context/appContext';
import { useAppContext } from '../../context/appContext';
import Leaderboard from './Leaderboard';

vi.mock('../../context/appContext', () => ({
  useAppContext: vi.fn(),
}));

const baseContext = {
  leaderboard: [{ _id: '1', name: 'Alice', totalPoints: 9, exactHits: 2 }],
  seasonLeaderboard: [{ _id: '2', name: 'Bob', totalPoints: 42, exactHits: 5 }],
  seasonLeaderboardYear: 2025,
  bundesligaMatchday: 3,
  fetchBundesligaMatches: vi.fn(),
  getLeaderboard: vi.fn(),
  getSeasonLeaderboard: vi.fn(),
  isLoading: false,
} as unknown as AppContextValue;

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppContext).mockReturnValue(baseContext);
  });

  it('shows the matchday table by default and does not fetch the season table yet', () => {
    render(<Leaderboard />);

    expect(screen.getByText('Tabelle 3. Spieltag')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(baseContext.getSeasonLeaderboard).not.toHaveBeenCalled();
  });

  it('switches to the season table on click and fetches it', async () => {
    const user = userEvent.setup();
    render(<Leaderboard />);

    await user.click(screen.getByRole('button', { name: 'Gesamt' }));

    expect(baseContext.getSeasonLeaderboard).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText(/Saison 2025\/2026/)).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('shows the exact-hits tie-breaker column', () => {
    render(<Leaderboard />);

    expect(
      screen.getByTitle('Exakte Ergebnisse — entscheidet bei Punktgleichstand')
    ).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows a fallback message when a table has no entries', () => {
    vi.mocked(useAppContext).mockReturnValue({
      ...baseContext,
      leaderboard: [],
    });
    render(<Leaderboard />);

    expect(screen.getByText('Keine Tabelle verfügbar')).toBeInTheDocument();
  });
});
