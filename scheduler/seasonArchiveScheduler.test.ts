import cron from 'node-cron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { archiveFinishedSeason } from './seasonArchive.js';
import { initializeSeasonArchiveCron } from './seasonArchiveScheduler.js';

vi.mock('node-cron', () => ({
  default: { schedule: vi.fn() },
}));

vi.mock('./seasonArchive.js', () => ({
  archiveFinishedSeason: vi.fn().mockResolvedValue(undefined),
}));

describe('initializeSeasonArchiveCron', () => {
  beforeEach(() => {
    vi.mocked(cron.schedule).mockClear();
    vi.mocked(archiveFinishedSeason).mockClear();
  });

  it('schedules archiveFinishedSeason to run daily at 03:00', () => {
    initializeSeasonArchiveCron();

    expect(cron.schedule).toHaveBeenCalledWith(
      '0 3 * * *',
      archiveFinishedSeason
    );
  });

  it('invokes archiveFinishedSeason when the scheduled task fires', () => {
    initializeSeasonArchiveCron();

    const [, task] = vi.mocked(cron.schedule).mock.calls[0];
    (task as () => void)();

    expect(archiveFinishedSeason).toHaveBeenCalledTimes(1);
  });
});
