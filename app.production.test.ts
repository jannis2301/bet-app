import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// app.ts reads NODE_ENV at module-load time to decide whether to register
// the SPA static/wildcard fallback, so it must be set before the (fresh,
// per-file) import below — not just before the request. A static `import`
// is hoisted above this assignment, so a dynamic `import()` is used instead.
process.env.NODE_ENV = 'production';
const { default: app } = await import('./app.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// app.ts serves client/dist/index.html for the SPA fallback; fake just
// enough of a build output for res.sendFile to actually succeed.
const distDir = path.join(__dirname, 'client', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

beforeAll(() => {
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(indexHtmlPath, '<!doctype html><title>fixture</title>');
});

afterAll(() => {
  fs.rmSync(distDir, { recursive: true, force: true });
});

describe('production mode (SPA fallback wired in)', () => {
  it('still routes API requests to the API router instead of the SPA fallback', async () => {
    const res = await request(app).get('/api/bets/leaderboard/season');

    // Whatever the API route responds with, it must not be the SPA's
    // index.html — that would mean the wildcard swallowed the request
    // before it ever reached the API router.
    expect(res.headers['content-type']).not.toMatch(/text\/html/);
  });

  it('falls back to the SPA for an unknown non-API route', async () => {
    const res = await request(app).get('/some/client-side/route');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('fixture');
  });
});
