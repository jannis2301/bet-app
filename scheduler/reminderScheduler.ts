import cron from 'node-cron';
import { sendMatchdayReminders } from './matchdayReminder.js';

// Every 30 minutes — frequent enough to catch the reminder window shortly
// after it opens, without hammering the openligadb API. sendMatchdayReminders()
// catches its own errors, so no error handling is needed here.
const CRON_EXPRESSION = '*/30 * * * *';

export const initializeReminderCron = (): void => {
  cron.schedule(CRON_EXPRESSION, sendMatchdayReminders);
};
