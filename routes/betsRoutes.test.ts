import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app.js';

describe('rate limiting on /api/bets/*', () => {
  it('sets rate-limit headers on responses', async () => {
    const res = await request(app).get('/api/bets/leaderboard/season');
    expect(res.headers['x-ratelimit-limit']).toBe('100');
  });

  it('blocks requests once the limit is exceeded', async () => {
    const responses = await Promise.all(
      Array.from({ length: 101 }, () =>
        request(app).get('/api/bets/leaderboard/season')
      )
    );
    expect(responses.map((res) => res.status)).toContain(429);
  }, 20000);
});
