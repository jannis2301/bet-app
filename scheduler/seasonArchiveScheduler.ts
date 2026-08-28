import cron from 'node-cron';
import { archiveFinishedSeason } from './seasonArchive.js';

// Once a day at 03:00 — this only ever does anything once a year (shortly
// after the season ends), so a daily check is more than frequent enough.
// archiveFinishedSeason() catches its own errors, so no error handling is
// needed here.
const CRON_EXPRESSION = '0 3 * * *';

export const initializeSeasonArchiveCron = (): void => {
  cron.schedule(CRON_EXPRESSION, archiveFinishedSeason);
};
