import Bet from '../models/Bet.js';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import { fetchBundesligaMatches } from '../utils/fetchMatches.js';
import { getCurrentSeason } from '../utils/season.js';
// imported via namespace (not destructured) so tests can vi.spyOn the
// exported binding directly — see betsController.test.ts for the same pattern
import * as sendEmailModule from '../utils/sendEmail.js';
import * as sendTelegramMessageModule from '../utils/sendTelegramMessage.js';

// send once the upcoming matchday's earliest kickoff falls within this window
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

// no incoming request here (this runs off a cron tick, not an HTTP handler)
// to derive a host from, unlike e.g. authController.ts's forgotPassword —
// RENDER_EXTERNAL_URL is set automatically for every Render web service, so
// production needs no extra config; APP_URL overrides it (e.g. for local
// testing). Without either, the reminder is just sent without a link.
const getAppUrl = (): string | undefined =>
  process.env.APP_URL || process.env.RENDER_EXTERNAL_URL;

const LINK_LABEL = 'Gehe jetzt zur Tippy-App';

const buildReminderMessage = (matchday: number) => {
  const question = `Der ${matchday}. Spieltag startet bald. Hast du schon getippt?`;
  const appUrl = getAppUrl();
  return {
    subject: `Spieltag ${matchday} startet bald`,
    // plain text can't render a hyperlink under a label, so the email's
    // text fallback spells out the URL instead
    text: appUrl ? `${question}\n\n${LINK_LABEL}: ${appUrl}` : question,
    html: appUrl
      ? `<p>${question}</p><p><a href="${appUrl}">${LINK_LABEL}</a></p>`
      : `<p>${question}</p>`,
    // Telegram messages are sent with parse_mode: 'HTML' (see
    // sendTelegramMessage.ts), so this can use the same link-under-a-label
    // markup as the email's html field
    telegramText: appUrl
      ? `${question}\n\n<a href="${appUrl}">${LINK_LABEL}</a>`
      : question,
  };
};

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
    });

    const { subject, text, html, telegramText } = buildReminderMessage(matchday);
    const emailResults = await Promise.allSettled(
      usersToRemind
        // $ne (not $eq: true) also matches documents from before this field
        // existed, which default to enabled
        .filter((user) => user.emailRemindersEnabled !== false)
        .map((user) =>
          sendEmailModule.sendEmail({ to: user.email, subject, text, html })
        )
    );
    const telegramResults = await Promise.allSettled(
      usersToRemind
        .filter(
          (user) => user.telegramChatId && user.telegramRemindersEnabled !== false
        )
        .map((user) =>
          sendTelegramMessageModule.sendTelegramMessage({
            chatId: user.telegramChatId as string,
            text: telegramText,
          })
        )
    );
    for (const result of [...emailResults, ...telegramResults]) {
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
