import cron from 'node-cron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendMatchdayReminders } from './matchdayReminder.js';
import { initializeReminderCron } from './reminderScheduler.js';

vi.mock('node-cron', () => ({
  default: { schedule: vi.fn() },
}));

vi.mock('./matchdayReminder.js', () => ({
  sendMatchdayReminders: vi.fn().mockResolvedValue(undefined),
}));

describe('initializeReminderCron', () => {
  beforeEach(() => {
    vi.mocked(cron.schedule).mockClear();
    vi.mocked(sendMatchdayReminders).mockClear();
  });

  it('schedules sendMatchdayReminders to run every 30 minutes', () => {
    initializeReminderCron();

    expect(cron.schedule).toHaveBeenCalledWith(
      '*/30 * * * *',
      sendMatchdayReminders
    );
  });

  it('invokes sendMatchdayReminders when the scheduled task fires', () => {
    initializeReminderCron();

    const [, task] = vi.mocked(cron.schedule).mock.calls[0];
    (task as () => void)();

    expect(sendMatchdayReminders).toHaveBeenCalledTimes(1);
  });
});
