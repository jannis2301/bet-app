import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBundesligaMatches } from './fetchMatches.js';
import { getCurrentSeason } from './season.js';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));

describe('fetchBundesligaMatches', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it('fetches matches for an explicitly given matchday, skipping the current-group lookup', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [{ matchID: 1 }] });

    const result = await fetchBundesligaMatches(5);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(
      `https://api.openligadb.de/getmatchdata/bl1/${getCurrentSeason()}/5`,
      expect.objectContaining({ timeout: expect.any(Number) })
    );
    expect(result).toEqual({ matchData: [{ matchID: 1 }], matchdayToFetch: 5 });
  });

  it('looks up the current matchday when none is given', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: { groupOrderID: 7 } })
      .mockResolvedValueOnce({ data: [{ matchID: 2 }] });

    const result = await fetchBundesligaMatches();

    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      'https://api.openligadb.de/getcurrentgroup/bl1',
      expect.objectContaining({ timeout: expect.any(Number) })
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      `https://api.openligadb.de/getmatchdata/bl1/${getCurrentSeason()}/7`,
      expect.objectContaining({ timeout: expect.any(Number) })
    );
    expect(result).toEqual({ matchData: [{ matchID: 2 }], matchdayToFetch: 7 });
  });

  it('looks up the current matchday when the given one is out of range', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: { groupOrderID: 3 } })
      .mockResolvedValueOnce({ data: [] });

    const result = await fetchBundesligaMatches(99);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result.matchdayToFetch).toBe(3);
  });
});
