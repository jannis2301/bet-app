import Bet from '../models/Bet.js';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import { fetchBundesligaMatches } from '../utils/fetchMatches.js';
import { getCurrentSeason } from '../utils/season.js';
// imported via namespace (not destructured) so tests can vi.spyOn the
// exported binding directly — see betsController.test.ts for the same pattern
import * as sendEmailModule from '../utils/sendEmail.js';

// send once the upcoming matchday's earliest kickoff falls within this window
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

const buildReminderEmail = (matchday: number) => ({
  subject: `Spieltag ${matchday} startet bald`,
  text: `Der ${matchday}. Spieltag startet bald. Hast du schon getippt?`,
  html: `<p>Der <strong>${matchday}. Spieltag</strong> startet bald. Hast du schon getippt?</p>`,
});

export const sendMatchdayReminders = async (): Promise<void> => {
  try {
    const { matchData: matches, matchdayToFetch: matchday } =
      await fetchBundesligaMatches();

    const upcomingKickoffs = matches
      .filter((match) => !match.matchIsFinished)
      .map((match) => new Date(match.matchDateTimeUTC).getTime())
      .filter((kickoff) => kickoff > Date.now());

    if (upcomingKickoffs.length === 0) return;

    const earliestKickoff = Math.min(...upcomingKickoffs);
    if (earliestKickoff - Date.now() > REMINDER_WINDOW_MS) return;

    const season = getCurrentSeason();

    const alreadySent = await Reminder.findOne({ season, matchday });
    if (alreadySent) return;

    const usersWhoBet = await Bet.distinct('createdBy', {
      matchDay: matchday,
      season,
    });
    const usersToRemind = await User.find({
      _id: { $nin: usersWhoBet },
      // $ne (not $eq: true) also matches documents from before this field
      // existed, which default to enabled
      emailRemindersEnabled: { $ne: false },
    });

    const { subject, text, html } = buildReminderEmail(matchday);
    const results = await Promise.allSettled(
      usersToRemind.map((user) =>
        sendEmailModule.sendEmail({ to: user.email, subject, text, html })
      )
    );
    for (const result of results) {
      if (result.status === 'rejected') console.error(result.reason);
    }

    // recorded once attempted, even if some emails failed above — a
    // best-effort reminder, not a guaranteed-delivery one, so the next cron
    // tick shouldn't re-email everyone who already got theirs
    await Reminder.create({ season, matchday });
  } catch (error) {
    console.error(error);
  }
};
