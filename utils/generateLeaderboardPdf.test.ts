import { describe, expect, it } from 'vitest';
import { generateLeaderboardPdf } from './generateLeaderboardPdf.js';

describe('generateLeaderboardPdf', () => {
  it('produces a valid PDF buffer for a populated leaderboard', async () => {
    const pdf = await generateLeaderboardPdf(2025, [
      { name: 'Zoe', totalPoints: 42, exactHits: 5 },
      { name: 'Anna', totalPoints: 40, exactHits: 3 },
    ]);

    expect(Buffer.isBuffer(pdf)).toBe(true);
    // every PDF starts with this magic header
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(100);
  });

  it('produces a valid PDF buffer for an empty leaderboard', async () => {
    const pdf = await generateLeaderboardPdf(2025, []);

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
