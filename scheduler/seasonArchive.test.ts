import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Bet from '../models/Bet.js';
import SeasonArchive from '../models/SeasonArchive.js';
import User from '../models/User.js';
import * as fetchMatches from '../utils/fetchMatches.js';
import { getCurrentSeason } from '../utils/season.js';
import { archiveFinishedSeason } from './seasonArchive.js';

const fetchMatchdayData = vi.spyOn(fetchMatches, 'fetchMatchdayData');

const placeholderTeams = {
  team1: { teamId: 1, shortName: 'FCB', teamIconUrl: 'bayern.png' },
  team2: { teamId: 2, shortName: 'VfB', teamIconUrl: 'stuttgart.png' },
  group: { groupOrderID: 34 },
};

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const finishedMatch = (matchID: number, kickoffDaysAgo: number) => ({
  matchID,
  matchDateTimeUTC: daysAgo(kickoffDaysAgo),
  matchIsFinished: true,
  matchResults: [],
  ...placeholderTeams,
});

const unfinishedMatch = (matchID: number) => ({
  matchID,
  matchDateTimeUTC: daysAgo(-2), // in the future
  matchIsFinished: false,
  matchResults: [],
  ...placeholderTeams,
});

const createUser = async (overrides: Record<string, unknown> = {}) =>
  User.create({
    name: 'Test User',
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    password: 'password123',
    ...overrides,
  });

describe('archiveFinishedSeason', () => {
  beforeEach(() => {
    fetchMatchdayData.mockReset();
  });

  it('does nothing when the final matchday has no data yet', async () => {
    fetchMatchdayData.mockResolvedValue([]);

    await archiveFinishedSeason();

    await expect(SeasonArchive.countDocuments()).resolves.toBe(0);
  });

  it('does nothing while the final matchday is still in progress', async () => {
    fetchMatchdayData.mockResolvedValue([
      finishedMatch(1, 40),
      unfinishedMatch(2),
    ]);

    await archiveFinishedSeason();

    await expect(SeasonArchive.countDocuments()).resolves.toBe(0);
  });

  it('does nothing until the archive delay has passed', async () => {
    fetchMatchdayData.mockResolvedValue([finishedMatch(1, 5)]);

    await archiveFinishedSeason();

    await expect(SeasonArchive.countDocuments()).resolves.toBe(0);
  });

  it('archives the final standings and deletes the season bets once the delay has passed', async () => {
    fetchMatchdayData.mockResolvedValue([finishedMatch(1, 40)]);
    const season = getCurrentSeason();
    const zoe = await createUser({ name: 'Zoe' });
    const anna = await createUser({ name: 'Anna' });
    await Bet.create([
      {
        matchDay: 34,
        matchID: 101,
        season,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 3,
        createdBy: zoe._id,
      },
      {
        matchDay: 34,
        matchID: 102,
        season,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 1,
        createdBy: anna._id,
      },
    ]);

    await archiveFinishedSeason();

    const archive = await SeasonArchive.findOne({ season });
    expect(archive).not.toBeNull();
    const plainLeaderboard = archive?.leaderboard.map(
      ({ name, totalPoints, exactHits }) => ({ name, totalPoints, exactHits })
    );
    expect(plainLeaderboard).toEqual([
      { name: 'Zoe', totalPoints: 3, exactHits: 1 },
      { name: 'Anna', totalPoints: 1, exactHits: 0 },
    ]);

    await expect(Bet.countDocuments({ season })).resolves.toBe(0);
  });

  it('does not archive again once already archived', async () => {
    const season = getCurrentSeason();
    await SeasonArchive.create({ season, leaderboard: [] });
    fetchMatchdayData.mockResolvedValue([finishedMatch(1, 40)]);
    await createUser();

    await archiveFinishedSeason();

    expect(fetchMatchdayData).not.toHaveBeenCalled();
  });

  it('never throws, even if fetching matches fails', async () => {
    fetchMatchdayData.mockRejectedValue(new Error('openligadb down'));

    await expect(archiveFinishedSeason()).resolves.toBeUndefined();
  });
});
