import cron from 'node-cron';
import { compareScores } from './compareScores.js';

// Midnight Sunday and midnight Wednesday, after the weekend and midweek
// matchdays have finished. compareScores() catches its own errors, so no
// error handling is needed here.
const CRON_EXPRESSIONS = ['0 0 * * 0', '0 0 * * 3'];

export const initializeCron = (): void => {
  for (const expression of CRON_EXPRESSIONS) {
    cron.schedule(expression, compareScores);
  }
};
