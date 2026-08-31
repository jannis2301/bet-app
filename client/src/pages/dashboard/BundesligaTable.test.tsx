import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../../context/appContext';
import { useAppContext } from '../../context/appContext';
import BundesligaTable from './BundesligaTable';

vi.mock('../../context/appContext', () => ({
  useAppContext: vi.fn(),
}));

const baseContext = {
  bundesligaTable: [
    {
      teamInfoId: 6,
      teamName: 'Bayer 04 Leverkusen',
      shortName: 'Leverkusen',
      teamIconUrl: 'leverkusen.png',
      points: 90,
      opponentGoals: 24,
      goals: 89,
      matches: 34,
      won: 28,
      lost: 0,
      draw: 6,
      goalDiff: 65,
    },
  ],
  bundesligaTableSeason: 2023,
  getBundesligaTable: vi.fn(),
} as unknown as AppContextValue;

describe('BundesligaTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppContext).mockReturnValue(baseContext);
  });

  it('fetches the table on mount and shows the season', () => {
    render(<BundesligaTable />);

    expect(baseContext.getBundesligaTable).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Saison 2023\/2024/)).toBeInTheDocument();
    expect(screen.getByText('Bayer 04 Leverkusen')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('shows a fallback message when no table data is available', () => {
    vi.mocked(useAppContext).mockReturnValue({
      ...baseContext,
      bundesligaTable: [],
    });
    render(<BundesligaTable />);

    expect(screen.getByText('Keine Tabelle verfügbar')).toBeInTheDocument();
  });
});
