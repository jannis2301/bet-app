import cron from 'node-cron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compareScores } from './compareScores.js';
import { initializeCron } from './matchCompareScheduler.js';

vi.mock('node-cron', () => ({
  default: { schedule: vi.fn() },
}));

vi.mock('./compareScores.js', () => ({
  compareScores: vi.fn().mockResolvedValue(undefined),
}));

describe('initializeCron', () => {
  beforeEach(() => {
    vi.mocked(cron.schedule).mockClear();
    vi.mocked(compareScores).mockClear();
  });

  it('schedules compareScores to run every 3 hours', () => {
    initializeCron();

    expect(cron.schedule).toHaveBeenCalledWith('0 */3 * * *', compareScores);
  });

  it('invokes compareScores when the scheduled task fires', () => {
    initializeCron();

    for (const [, task] of vi.mocked(cron.schedule).mock.calls) {
      (task as () => void)();
    }

    expect(compareScores).toHaveBeenCalledTimes(1);
  });
});
