import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Bet from '../models/Bet.js';
import User from '../models/User.js';
import type { OpenligaMatch } from '../utils/fetchMatches.js';
import * as fetchMatches from '../utils/fetchMatches.js';
import { getCurrentSeason } from '../utils/season.js';
import { compareScores } from './compareScores.js';

const fetchBundesligaMatches = vi.spyOn(fetchMatches, 'fetchBundesligaMatches');

// team1/team2/group are part of the real OpenligaMatch shape but unused by
// compareScores — filled with placeholder values just to satisfy the type.
const placeholderTeams = {
  team1: { teamId: 1, shortName: 'FCB', teamIconUrl: 'bayern.png' },
  team2: { teamId: 2, shortName: 'VfB', teamIconUrl: 'stuttgart.png' },
  group: { groupOrderID: 1 },
};

const finishedMatch = (
  matchID: number,
  homeScore: number,
  awayScore: number
): OpenligaMatch => ({
  matchID,
  matchDateTimeUTC: new Date().toISOString(),
  matchIsFinished: true,
  matchResults: [
    { pointsTeam1: 0, pointsTeam2: 0, resultTypeID: 1 },
    { pointsTeam1: homeScore, pointsTeam2: awayScore, resultTypeID: 2 },
  ],
  ...placeholderTeams,
});

const unfinishedMatch = (matchID: number): OpenligaMatch => ({
  matchID,
  matchDateTimeUTC: new Date().toISOString(),
  matchIsFinished: false,
  matchResults: [],
  ...placeholderTeams,
});

const createUser = async () =>
  User.create({
    name: 'Test User',
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    password: 'password123',
  });

const createBet = async (overrides: Record<string, unknown>) => {
  const user = await createUser();
  return Bet.create({
    matchDay: 1,
    matchID: 1,
    season: getCurrentSeason(),
    homeScore: 0,
    awayScore: 0,
    createdBy: user._id,
    ...overrides,
  });
};

describe('compareScores', () => {
  beforeEach(() => {
    fetchBundesligaMatches.mockReset();
  });

  it('does nothing while matches for the matchday are still in progress', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [finishedMatch(1, 2, 1), unfinishedMatch(2)],
      matchdayToFetch: 1,
    });
    const bet = await createBet({ matchID: 1, homeScore: 2, awayScore: 1 });

    await compareScores();

    await expect(Bet.findById(bet._id)).resolves.toMatchObject({
      pointsEarned: 0,
    });
  });

  it('awards 3 points for an exact score prediction', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [finishedMatch(1, 2, 1)],
      matchdayToFetch: 1,
    });
    const bet = await createBet({ matchID: 1, homeScore: 2, awayScore: 1 });

    await compareScores();

    await expect(Bet.findById(bet._id)).resolves.toMatchObject({
      pointsEarned: 3,
    });
  });

  it('awards 1 point for correctly predicting the winner with the wrong score', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [finishedMatch(1, 3, 1)],
      matchdayToFetch: 1,
    });
    const bet = await createBet({ matchID: 1, homeScore: 2, awayScore: 0 });

    await compareScores();

    await expect(Bet.findById(bet._id)).resolves.toMatchObject({
      pointsEarned: 1,
    });
  });

  it('awards 1 point for correctly predicting a draw with the wrong score', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [finishedMatch(1, 2, 2)],
      matchdayToFetch: 1,
    });
    const bet = await createBet({ matchID: 1, homeScore: 1, awayScore: 1 });

    await compareScores();

    await expect(Bet.findById(bet._id)).resolves.toMatchObject({
      pointsEarned: 1,
    });
  });

  it('awards 0 points for a wrong prediction', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [finishedMatch(1, 2, 0)],
      matchdayToFetch: 1,
    });
    const bet = await createBet({ matchID: 1, homeScore: 0, awayScore: 2 });

    await compareScores();

    await expect(Bet.findById(bet._id)).resolves.toMatchObject({
      pointsEarned: 0,
    });
  });

  it('only updates bets from the current season, leaving other seasons untouched', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [finishedMatch(1, 2, 1)],
      matchdayToFetch: 1,
    });
    const currentSeasonBet = await createBet({
      matchID: 1,
      homeScore: 2,
      awayScore: 1,
      season: getCurrentSeason(),
    });
    const pastSeasonBet = await createBet({
      matchID: 1,
      homeScore: 2,
      awayScore: 1,
      season: getCurrentSeason() - 1,
    });

    await compareScores();

    await expect(Bet.findById(currentSeasonBet._id)).resolves.toMatchObject({
      pointsEarned: 3,
    });
    await expect(Bet.findById(pastSeasonBet._id)).resolves.toMatchObject({
      pointsEarned: 0,
    });
  });

  it('skips a match with no final result instead of aborting the whole batch', async () => {
    const matchWithoutFinalResult: OpenligaMatch = {
      matchID: 1,
      matchDateTimeUTC: new Date().toISOString(),
      matchIsFinished: true,
      matchResults: [{ pointsTeam1: 1, pointsTeam2: 0, resultTypeID: 1 }],
      ...placeholderTeams,
    };
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [matchWithoutFinalResult, finishedMatch(2, 1, 0)],
      matchdayToFetch: 1,
    });
    const brokenBet = await createBet({
      matchID: 1,
      homeScore: 1,
      awayScore: 0,
    });
    const okBet = await createBet({ matchID: 2, homeScore: 1, awayScore: 0 });

    await compareScores();

    await expect(Bet.findById(brokenBet._id)).resolves.toMatchObject({
      pointsEarned: 0,
    });
    await expect(Bet.findById(okBet._id)).resolves.toMatchObject({
      pointsEarned: 3,
    });
  });

  it('does nothing when the matchday has no matches', async () => {
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [],
      matchdayToFetch: 1,
    });
    const bet = await createBet({ matchID: 1, homeScore: 2, awayScore: 1 });

    await compareScores();

    await expect(Bet.findById(bet._id)).resolves.toMatchObject({
      pointsEarned: 0,
    });
  });

  it('swallows errors from a failed fetch instead of throwing', async () => {
    fetchBundesligaMatches.mockRejectedValue(new Error('network error'));

    await expect(compareScores()).resolves.toBeUndefined();
  });
});
