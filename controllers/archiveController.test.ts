import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';
import SeasonArchive from '../models/SeasonArchive.js';
import User from '../models/User.js';

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

const authCookie = async () => {
  const user = await User.create({
    name: 'Archive Tester',
    email: `${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
  });
  return `token=${signToken(user._id.toString())}`;
};

describe('GET /api/archive', () => {
  it('rejects requests without a valid auth cookie', async () => {
    const res = await request(app).get('/api/archive');
    expect(res.status).toBe(401);
  });

  it('lists archived seasons newest first, with an entry count instead of the full leaderboard', async () => {
    const cookie = await authCookie();
    await SeasonArchive.create([
      {
        season: 2024,
        leaderboard: [{ name: 'Alice', totalPoints: 10, exactHits: 1 }],
      },
      {
        season: 2025,
        leaderboard: [
          { name: 'Bob', totalPoints: 20, exactHits: 2 },
          { name: 'Carol', totalPoints: 15, exactHits: 1 },
        ],
      },
    ]);

    const res = await request(app).get('/api/archive').set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.archives).toEqual([
      expect.objectContaining({ season: 2025, entryCount: 2 }),
      expect.objectContaining({ season: 2024, entryCount: 1 }),
    ]);
    expect(res.body.archives[0].leaderboard).toBeUndefined();
  });
});

describe('GET /api/archive/:season', () => {
  it('rejects requests without a valid auth cookie', async () => {
    const res = await request(app).get('/api/archive/2025');
    expect(res.status).toBe(401);
  });

  it('returns 404 for a season with no archive', async () => {
    const cookie = await authCookie();

    const res = await request(app)
      .get('/api/archive/2099')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(404);
  });

  it('returns the full leaderboard for an archived season', async () => {
    const cookie = await authCookie();
    await SeasonArchive.create({
      season: 2025,
      leaderboard: [{ name: 'Dana', totalPoints: 30, exactHits: 4 }],
    });

    const res = await request(app)
      .get('/api/archive/2025')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(200);
    expect(res.body.season).toBe(2025);
    expect(res.body.leaderboard).toEqual([
      { name: 'Dana', totalPoints: 30, exactHits: 4 },
    ]);
  });
});

describe('GET /api/archive/:season/pdf', () => {
  it('rejects requests without a valid auth cookie', async () => {
    const res = await request(app).get('/api/archive/2025/pdf');
    expect(res.status).toBe(401);
  });

  it('returns 404 for a season with no archive', async () => {
    const cookie = await authCookie();

    const res = await request(app)
      .get('/api/archive/2099/pdf')
      .set('Cookie', [cookie]);

    expect(res.status).toBe(404);
  });

  it('streams a PDF download for an archived season', async () => {
    const cookie = await authCookie();
    await SeasonArchive.create({
      season: 2025,
      leaderboard: [{ name: 'Eve', totalPoints: 25, exactHits: 2 }],
    });

    const res = await request(app)
      .get('/api/archive/2025/pdf')
      .set('Cookie', [cookie])
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toMatch(
      /attachment; filename="saison-2025-2026-endtabelle\.pdf"/
    );
    expect((res.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });
});
