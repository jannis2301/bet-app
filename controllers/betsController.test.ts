import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../app.js';
import Bet from '../models/Bet.js';
import User from '../models/User.js';
import * as fetchMatches from '../utils/fetchMatches.js';
import { getCurrentSeason } from '../utils/season.js';

// betsController.ts calls fetchMatches.fetchBundesligaMatches() via the
// module namespace (not a destructured reference), so vi.spyOn can patch
// the exported binding directly — Vitest's module runner makes named ESM
// exports mutable for exactly this purpose.
const fetchBundesligaMatches = vi.spyOn(fetchMatches, 'fetchBundesligaMatches');

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

const createUser = async (overrides = {}) =>
  User.create({
    name: 'Test User',
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    password: 'password123',
    ...overrides,
  });

// team1/team2/group are part of the real OpenligaMatch shape but unused by
// betsController — filled with placeholder values just to satisfy the type.
const placeholderTeams = {
  team1: { teamId: 1, shortName: 'FCB', teamIconUrl: 'bayern.png' },
  team2: { teamId: 2, shortName: 'VfB', teamIconUrl: 'stuttgart.png' },
  group: { groupOrderID: 1 },
};

const futureMatch = (matchID: number) => ({
  matchID,
  matchDateTimeUTC: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  matchIsFinished: false,
  matchResults: [],
  ...placeholderTeams,
});

const pastMatch = (matchID: number) => ({
  matchID,
  matchDateTimeUTC: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  matchIsFinished: false,
  matchResults: [],
  ...placeholderTeams,
});

describe('POST /api/bets/user/:userId', () => {
  beforeEach(() => {
    fetchBundesligaMatches.mockReset();
  });

  it('rejects requests without a valid auth cookie', async () => {
    const user = await createUser();

    const res = await request(app)
      .post(`/api/bets/user/${user._id}`)
      .send([{ matchID: 1, matchDay: 1, homeScore: 1, awayScore: 1 }]);

    expect(res.status).toBe(401);
  });

  it('rejects betting on behalf of another user', async () => {
    const user = await createUser();
    const token = signToken(new mongoose.Types.ObjectId().toString());

    const res = await request(app)
      .post(`/api/bets/user/${user._id}`)
      .set('Cookie', [`token=${token}`])
      .send([{ matchID: 1, matchDay: 1, homeScore: 1, awayScore: 1 }]);

    expect(res.status).toBe(401);
  });

  it('rejects a bet on a match that has already started', async () => {
    const user = await createUser();
    const token = signToken(user._id.toString());
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [pastMatch(101)],
      matchdayToFetch: 1,
    });

    const res = await request(app)
      .post(`/api/bets/user/${user._id}`)
      .set('Cookie', [`token=${token}`])
      .send([{ matchID: 101, matchDay: 1, homeScore: 2, awayScore: 1 }]);

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/already started/i);
    await expect(Bet.countDocuments()).resolves.toBe(0);
  });

  it('rejects negative scores', async () => {
    const user = await createUser();
    const token = signToken(user._id.toString());
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [futureMatch(102)],
      matchdayToFetch: 1,
    });

    const res = await request(app)
      .post(`/api/bets/user/${user._id}`)
      .set('Cookie', [`token=${token}`])
      .send([{ matchID: 102, matchDay: 1, homeScore: -1, awayScore: 0 }]);

    expect(res.status).toBe(400);
  });

  it('creates a bet for an upcoming match and tags it with the current season', async () => {
    const user = await createUser();
    const token = signToken(user._id.toString());
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [futureMatch(103)],
      matchdayToFetch: 5,
    });

    const res = await request(app)
      .post(`/api/bets/user/${user._id}`)
      .set('Cookie', [`token=${token}`])
      .send([{ matchID: 103, matchDay: 5, homeScore: 2, awayScore: 0 }]);

    expect(res.status).toBe(201);
    const bet = await Bet.findOne({ matchID: 103 });
    expect(bet).toMatchObject({
      matchDay: 5,
      homeScore: 2,
      awayScore: 0,
      season: getCurrentSeason(),
    });
  });

  it('updates an existing bet instead of creating a duplicate', async () => {
    const user = await createUser();
    const token = signToken(user._id.toString());
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [futureMatch(104)],
      matchdayToFetch: 1,
    });

    await request(app)
      .post(`/api/bets/user/${user._id}`)
      .set('Cookie', [`token=${token}`])
      .send([{ matchID: 104, matchDay: 1, homeScore: 1, awayScore: 1 }]);

    await request(app)
      .post(`/api/bets/user/${user._id}`)
      .set('Cookie', [`token=${token}`])
      .send([{ matchID: 104, matchDay: 1, homeScore: 3, awayScore: 0 }]);

    const bets = await Bet.find({ matchID: 104 });
    expect(bets).toHaveLength(1);
    expect(bets[0]).toMatchObject({ homeScore: 3, awayScore: 0 });
  });
});

describe('GET /api/bets/user/:matchday', () => {
  beforeEach(() => {
    fetchBundesligaMatches.mockReset();
  });

  it('only returns bets from the current season for that matchday', async () => {
    const user = await createUser();
    const token = signToken(user._id.toString());
    fetchBundesligaMatches.mockResolvedValue({
      matchData: [futureMatch(201)],
      matchdayToFetch: 1,
    });

    await Bet.create([
      {
        matchID: 201,
        matchDay: 1,
        homeScore: 1,
        awayScore: 0,
        season: getCurrentSeason(),
        createdBy: user._id,
      },
      {
        matchID: 202,
        matchDay: 1,
        homeScore: 2,
        awayScore: 2,
        season: getCurrentSeason() - 1,
        createdBy: user._id,
      },
    ]);

    const res = await request(app)
      .get('/api/bets/user/1')
      .set('Cookie', [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.userBets).toHaveLength(1);
    expect(res.body.userBets[0]).toMatchObject({ matchID: 201 });
  });
});

describe('GET /api/bets/leaderboard/:matchday', () => {
  it('sums points only for bets in the current season for that matchday', async () => {
    const alice = await createUser({
      name: 'Alice',
      email: 'alice3@test.com',
    });
    const currentSeason = getCurrentSeason();

    await Bet.create([
      {
        matchID: 301,
        matchDay: 1,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 3,
        season: currentSeason,
        createdBy: alice._id,
      },
      // a bet from a previous season on the same matchday must not count
      {
        matchID: 302,
        matchDay: 1,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 100,
        season: currentSeason - 1,
        createdBy: alice._id,
      },
    ]);

    const res = await request(app).get('/api/bets/leaderboard/1');

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toEqual([
      {
        _id: expect.any(String),
        name: 'Alice',
        team: 'my team',
        totalPoints: 3,
        exactHits: 1,
      },
    ]);
  });

  it('breaks a points tie by exact-result hits, then alphabetically by name', async () => {
    const zoe = await createUser({ name: 'Zoe', email: 'zoe@test.com' });
    const anna = await createUser({ name: 'Anna', email: 'anna@test.com' });
    const bert = await createUser({ name: 'Bert', email: 'bert@test.com' });
    const season = getCurrentSeason();

    await Bet.create([
      // Zoe: 3 + 1 = 4 points, one exact hit
      {
        matchID: 401,
        matchDay: 9,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 3,
        season,
        createdBy: zoe._id,
      },
      {
        matchID: 402,
        matchDay: 9,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 1,
        season,
        createdBy: zoe._id,
      },
      // Anna: 1 + 3 = 4 points, one exact hit — same as Zoe, decided by name
      {
        matchID: 403,
        matchDay: 9,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 1,
        season,
        createdBy: anna._id,
      },
      {
        matchID: 404,
        matchDay: 9,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 3,
        season,
        createdBy: anna._id,
      },
      // Bert: 3 + 1 = 4 points too, but no exact hit at all — ranks last
      // despite the same total, since Anna/Zoe each have one
      {
        matchID: 405,
        matchDay: 9,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 2,
        season,
        createdBy: bert._id,
      },
      {
        matchID: 406,
        matchDay: 9,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 2,
        season,
        createdBy: bert._id,
      },
    ]);

    const res = await request(app).get('/api/bets/leaderboard/9');

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toEqual([
      {
        _id: expect.any(String),
        name: 'Anna',
        team: 'my team',
        totalPoints: 4,
        exactHits: 1,
      },
      {
        _id: expect.any(String),
        name: 'Zoe',
        team: 'my team',
        totalPoints: 4,
        exactHits: 1,
      },
      {
        _id: expect.any(String),
        name: 'Bert',
        team: 'my team',
        totalPoints: 4,
        exactHits: 0,
      },
    ]);
  });

  it('reports no bets when only a previous season has entries for that matchday', async () => {
    const alice = await createUser({
      name: 'Alice',
      email: 'alice4@test.com',
    });

    await Bet.create({
      matchID: 303,
      matchDay: 2,
      homeScore: 1,
      awayScore: 1,
      pointsEarned: 3,
      season: getCurrentSeason() - 1,
      createdBy: alice._id,
    });

    const res = await request(app).get('/api/bets/leaderboard/2');

    expect(res.status).toBe(200);
    expect(res.body.msg).toMatch(/No bets have been placed/i);
  });
});

describe('GET /api/bets/leaderboard/season', () => {
  it('sums points per user across matchdays within the current season, sorted descending', async () => {
    const alice = await createUser({ name: 'Alice', email: 'alice@test.com' });
    const bob = await createUser({ name: 'Bob', email: 'bob@test.com' });
    const currentSeason = getCurrentSeason();

    await Bet.create([
      {
        matchID: 1,
        matchDay: 1,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 3,
        season: currentSeason,
        createdBy: alice._id,
      },
      {
        matchID: 2,
        matchDay: 2,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 1,
        season: currentSeason,
        createdBy: alice._id,
      },
      {
        matchID: 3,
        matchDay: 1,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 3,
        season: currentSeason,
        createdBy: bob._id,
      },
      // a bet from a previous season should not count towards this season's total
      {
        matchID: 4,
        matchDay: 1,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 100,
        season: currentSeason - 1,
        createdBy: bob._id,
      },
    ]);

    const res = await request(app).get('/api/bets/leaderboard/season');

    expect(res.status).toBe(200);
    expect(res.body.season).toBe(currentSeason);
    expect(res.body.leaderboard).toEqual([
      {
        _id: expect.any(String),
        name: 'Alice',
        team: 'my team',
        totalPoints: 4,
        exactHits: 1,
      },
      {
        _id: expect.any(String),
        name: 'Bob',
        team: 'my team',
        totalPoints: 3,
        exactHits: 1,
      },
    ]);
  });

  it('filters by an explicit season query param', async () => {
    const alice = await createUser({
      name: 'Alice',
      email: 'alice2@test.com',
    });
    const oldSeason = getCurrentSeason() - 1;

    await Bet.create({
      matchID: 5,
      matchDay: 1,
      homeScore: 1,
      awayScore: 1,
      pointsEarned: 7,
      season: oldSeason,
      createdBy: alice._id,
    });

    const res = await request(app).get(
      `/api/bets/leaderboard/season?season=${oldSeason}`
    );

    expect(res.status).toBe(200);
    expect(res.body.season).toBe(oldSeason);
    expect(res.body.leaderboard).toEqual([
      {
        _id: expect.any(String),
        name: 'Alice',
        team: 'my team',
        totalPoints: 7,
        exactHits: 0,
      },
    ]);
  });

  it('breaks a points tie by exact-result hits, then alphabetically by name', async () => {
    const zoe = await createUser({ name: 'Zoe', email: 'zoe-season@test.com' });
    const anna = await createUser({
      name: 'Anna',
      email: 'anna-season@test.com',
    });
    const season = getCurrentSeason();

    await Bet.create([
      // Zoe: 3 points from one exact hit
      {
        matchID: 501,
        matchDay: 1,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 3,
        season,
        createdBy: zoe._id,
      },
      // Anna: 1 + 1 + 1 = 3 points, no exact hit — ranks below Zoe despite
      // the same total
      {
        matchID: 502,
        matchDay: 1,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 1,
        season,
        createdBy: anna._id,
      },
      {
        matchID: 503,
        matchDay: 2,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 1,
        season,
        createdBy: anna._id,
      },
      {
        matchID: 504,
        matchDay: 3,
        homeScore: 1,
        awayScore: 1,
        pointsEarned: 1,
        season,
        createdBy: anna._id,
      },
    ]);

    const res = await request(app).get('/api/bets/leaderboard/season');

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toEqual([
      {
        _id: expect.any(String),
        name: 'Zoe',
        team: 'my team',
        totalPoints: 3,
        exactHits: 1,
      },
      {
        _id: expect.any(String),
        name: 'Anna',
        team: 'my team',
        totalPoints: 3,
        exactHits: 0,
      },
    ]);
  });
});
