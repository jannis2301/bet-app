import { describe, expect, it, vi } from 'vitest';
import { getCurrentSeason } from './season.js';

describe('getCurrentSeason', () => {
  it('returns the current year while inside the season (August-December)', () => {
    vi.setSystemTime(new Date('2025-08-15T12:00:00Z'));
    expect(getCurrentSeason()).toBe(2025);
    vi.useRealTimers();
  });

  it('returns the previous year while inside the season (January-July)', () => {
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    expect(getCurrentSeason()).toBe(2025);
    vi.useRealTimers();
  });

  it('flips over between July and August', () => {
    // Midday timestamps, safely clear of the local timezone's midnight
    // boundary so this doesn't flip depending on where tests run.
    vi.setSystemTime(new Date('2025-07-15T12:00:00Z'));
    expect(getCurrentSeason()).toBe(2024);
    vi.useRealTimers();

    vi.setSystemTime(new Date('2025-08-15T12:00:00Z'));
    expect(getCurrentSeason()).toBe(2025);
    vi.useRealTimers();
  });
});
