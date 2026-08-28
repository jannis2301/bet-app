import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppContextValue } from '../../context/appContext';
import { useAppContext } from '../../context/appContext';
import PastSeasons from './PastSeasons';

vi.mock('../../context/appContext', () => ({
  useAppContext: vi.fn(),
}));

const baseContext = {
  archivedSeasons: [
    { season: 2025, archivedAt: '2026-06-15T00:00:00Z', entryCount: 2 },
    { season: 2024, archivedAt: '2025-06-15T00:00:00Z', entryCount: 0 },
  ],
  selectedSeasonArchive: null,
  getArchivedSeasons: vi.fn(),
  getSeasonArchive: vi.fn(),
  isLoading: false,
} as unknown as AppContextValue;

describe('PastSeasons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppContext).mockReturnValue(baseContext);
  });

  it('fetches and lists archived seasons', () => {
    render(<PastSeasons />);

    expect(baseContext.getArchivedSeasons).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Saison 2025/2026')).toBeInTheDocument();
    expect(screen.getByText('Saison 2024/2025')).toBeInTheDocument();
  });

  it('shows a fallback message for a season with no entries', () => {
    render(<PastSeasons />);

    expect(
      screen.getByText('Keine Tipps in dieser Saison.')
    ).toBeInTheDocument();
  });

  it('offers a PDF download link per season', () => {
    render(<PastSeasons />);

    const links = screen.getAllByRole('link', { name: 'PDF herunterladen' });
    expect(links[0]).toHaveAttribute('href', '/api/archive/2025/pdf');
    expect(links[1]).toHaveAttribute('href', '/api/archive/2024/pdf');
  });

  it('loads and shows the table when toggled', async () => {
    const user = userEvent.setup();
    vi.mocked(useAppContext).mockReturnValue({
      ...baseContext,
      selectedSeasonArchive: {
        season: 2025,
        leaderboard: [{ name: 'Zoe', totalPoints: 30, exactHits: 3 }],
      },
    });
    render(<PastSeasons />);

    const toggleButtons = screen.getAllByRole('button', {
      name: 'Tabelle anzeigen',
    });
    await user.click(toggleButtons[0]);

    expect(baseContext.getSeasonArchive).toHaveBeenCalledWith(2025);
    expect(screen.getByText('Zoe')).toBeInTheDocument();
  });

  it('shows a message when there are no archived seasons at all', () => {
    vi.mocked(useAppContext).mockReturnValue({
      ...baseContext,
      archivedSeasons: [],
    });
    render(<PastSeasons />);

    expect(
      screen.getByText('Es sind noch keine Saisons archiviert.')
    ).toBeInTheDocument();
  });
});
