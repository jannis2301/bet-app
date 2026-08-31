import cron from 'node-cron';
import { compareScores } from './compareScores.js';

// Every 3 hours, as a backup for stretches where the app stays warm under
// real traffic — server.ts's startup call is what actually catches results
// promptly on Render's free plan (see comment there). compareScores()
// catches its own errors, so no error handling is needed here.
const CRON_EXPRESSION = '0 */3 * * *';

export const initializeCron = (): void => {
  cron.schedule(CRON_EXPRESSION, compareScores);
};
