import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../app.js';
import User from '../models/User.js';
import * as fetchMatches from '../utils/fetchMatches.js';
import { getCurrentSeason } from '../utils/season.js';

// tableController.ts calls this via the module namespace (not a destructured
// reference), so vi.spyOn can patch the exported binding directly.
const fetchBundesligaTable = vi.spyOn(fetchMatches, 'fetchBundesligaTable');

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

const authCookie = async () => {
  const user = await User.create({
    name: 'Table Tester',
    email: `${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
  });
  return `token=${signToken(user._id.toString())}`;
};

const fakeTableEntry = (teamInfoId: number) => ({
  teamInfoId,
  teamName: 'FC Bayern München',
  shortName: 'Bayern',
  teamIconUrl: 'bayern.png',
  points: 10,
  opponentGoals: 5,
  goals: 15,
  matches: 4,
  won: 3,
  lost: 0,
  draw: 1,
  goalDiff: 10,
});

describe('GET /api/table', () => {
  beforeEach(() => {
    fetchBundesligaTable.mockReset();
  });

  it('rejects requests without a valid auth cookie', async () => {
    const res = await request(app).get('/api/table');
    expect(res.status).toBe(401);
  });

  it('returns the current season table', async () => {
    const cookie = await authCookie();
    fetchBundesligaTable.mockResolvedValue([fakeTableEntry(40)]);

    const res = await request(app).get('/api/table').set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.season).toBe(getCurrentSeason());
    expect(res.body.table).toHaveLength(1);
    expect(fetchBundesligaTable).toHaveBeenCalledWith(getCurrentSeason());
  });
});
