import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import connectDB from './db/connect.js';
import { compareScores } from './scheduler/compareScores.js';
import { initializeCron } from './scheduler/matchCompareScheduler.js';
import { initializeReminderCron } from './scheduler/reminderScheduler.js';
import { initializeSeasonArchiveCron } from './scheduler/seasonArchiveScheduler.js';

const port = process.env.PORT || 5050;

// Initialize the cron scheduler jobs
initializeCron();
initializeReminderCron();
initializeSeasonArchiveCron();

const start = async () => {
  try {
    await connectDB(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');
    // Render's free plan sleeps the service (and its cron timers) when idle,
    // so run once here too — every wake-up then catches up immediately.
    compareScores();
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
