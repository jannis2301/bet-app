import { describe, expect, it } from 'vitest';
import type { Match } from '../types';
import sortMatchesByKickoff from './sortMatches';

const match = (matchID: number, matchDateTimeUTC: string): Match => ({
  matchID,
  team1: { teamId: 1, shortName: 'A', teamIconUrl: '' },
  team2: { teamId: 2, shortName: 'B', teamIconUrl: '' },
  matchResults: [],
  matchIsFinished: false,
  matchDateTimeUTC,
  group: { groupOrderID: 1 },
});

describe('sortMatchesByKickoff', () => {
  it('orders matches by kickoff time, earliest first', () => {
    const friday = match(1, '2025-08-22T18:30:00Z');
    const saturday = match(2, '2025-08-23T13:30:00Z');
    const sunday = match(3, '2025-08-24T15:30:00Z');

    const sorted = sortMatchesByKickoff([sunday, friday, saturday]);

    expect(sorted.map((m) => m.matchID)).toEqual([1, 2, 3]);
  });

  it('does not mutate the original array', () => {
    const friday = match(1, '2025-08-22T18:30:00Z');
    const sunday = match(3, '2025-08-24T15:30:00Z');
    const original = [sunday, friday];

    sortMatchesByKickoff(original);

    expect(original.map((m) => m.matchID)).toEqual([3, 1]);
  });

  it('leaves an already-sorted list unchanged', () => {
    const friday = match(1, '2025-08-22T18:30:00Z');
    const saturday = match(2, '2025-08-23T13:30:00Z');

    const sorted = sortMatchesByKickoff([friday, saturday]);

    expect(sorted.map((m) => m.matchID)).toEqual([1, 2]);
  });
});
