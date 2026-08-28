import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../app.js';
import User from '../models/User.js';
import * as fetchMatches from '../utils/fetchMatches.js';

// matchesController.ts calls these via the module namespace (not destructured
// references), so vi.spyOn can patch the exported bindings directly.
const fetchCurrentMatchday = vi.spyOn(fetchMatches, 'fetchCurrentMatchday');
const fetchMatchdayData = vi.spyOn(fetchMatches, 'fetchMatchdayData');

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

const authCookie = async () => {
  const user = await User.create({
    name: 'Match Tester',
    email: `${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
  });
  return `token=${signToken(user._id.toString())}`;
};

const fakeMatch = (matchID: number) => ({
  matchID,
  team1: { teamId: 1, shortName: 'FCB', teamIconUrl: 'bayern.png' },
  team2: { teamId: 2, shortName: 'VfB', teamIconUrl: 'stuttgart.png' },
  matchDateTimeUTC: new Date().toISOString(),
  matchIsFinished: false,
  matchResults: [],
  group: { groupOrderID: 1 },
});

describe('GET /api/matches', () => {
  beforeEach(() => {
    fetchCurrentMatchday.mockReset();
    fetchMatchdayData.mockReset();
  });

  it('rejects requests without a valid auth cookie', async () => {
    const res = await request(app).get('/api/matches');
    expect(res.status).toBe(401);
  });

  it('rejects a non-integer matchday', async () => {
    const cookie = await authCookie();

    const res = await request(app)
      .get('/api/matches')
      .query({ matchday: 'not-a-number' })
      .set('Cookie', [cookie]);

    expect(res.status).toBe(400);
  });

  it('fetches the current matchday when none is requested', async () => {
    const cookie = await authCookie();
    fetchCurrentMatchday.mockResolvedValue(5);
    fetchMatchdayData.mockResolvedValue([fakeMatch(201)]);

    const res = await request(app).get('/api/matches').set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.matchday).toBe(5);
    expect(res.body.currentMatchday).toBe(5);
    expect(res.body.matches).toHaveLength(1);
    expect(fetchMatchdayData).toHaveBeenCalledWith(5);
  });

  it('fetches the requested matchday, independent of the current one', async () => {
    const cookie = await authCookie();
    fetchCurrentMatchday.mockResolvedValue(5);
    fetchMatchdayData.mockResolvedValue([fakeMatch(202)]);

    const res = await request(app)
      .get('/api/matches')
      .query({ matchday: 3 })
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.matchday).toBe(3);
    expect(res.body.currentMatchday).toBe(5);
    expect(fetchMatchdayData).toHaveBeenCalledWith(3);
  });

  it('wraps a matchday below 1 around to 34', async () => {
    const cookie = await authCookie();
    fetchCurrentMatchday.mockResolvedValue(1);
    fetchMatchdayData.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/matches')
      .query({ matchday: 0 })
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.matchday).toBe(34);
    expect(fetchMatchdayData).toHaveBeenCalledWith(34);
  });

  it('wraps a matchday above 34 around to 1', async () => {
    const cookie = await authCookie();
    fetchCurrentMatchday.mockResolvedValue(34);
    fetchMatchdayData.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/matches')
      .query({ matchday: 35 })
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.matchday).toBe(1);
    expect(fetchMatchdayData).toHaveBeenCalledWith(1);
  });
});
