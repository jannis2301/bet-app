import Bet from '../models/Bet.js';
import SeasonArchive from '../models/SeasonArchive.js';
// imported via namespace (not destructured) so tests can vi.spyOn the
// exported binding directly — see betsController.test.ts for the same pattern
import * as fetchMatches from '../utils/fetchMatches.js';
import { MAX_MATCHDAY } from '../utils/fetchMatches.js';
import { buildSeasonLeaderboard } from '../utils/leaderboard.js';
import { getCurrentSeason } from '../utils/season.js';

// buffer after the season's last matchday before archiving — gives time for
// postponed matches, corrections, or disputes to settle before the bets
// (the underlying data behind the standings) get deleted for good
const ARCHIVE_DELAY_MS = 30 * 24 * 60 * 60 * 1000;

export const archiveFinishedSeason = async (): Promise<void> => {
  try {
    const season = getCurrentSeason();

    // already handled — nothing to do until the calendar rolls over to a
    // new season
    if (await SeasonArchive.findOne({ season })) return;

    const finalMatchday = await fetchMatches.fetchMatchdayData(MAX_MATCHDAY);
    if (finalMatchday.length === 0) return;

    const seasonHasFinished = finalMatchday.every(
      (match) => match.matchIsFinished
    );
    if (!seasonHasFinished) return;

    const lastKickoff = Math.max(
      ...finalMatchday.map((match) =>
        new Date(match.matchDateTimeUTC).getTime()
      )
    );
    if (Date.now() - lastKickoff < ARCHIVE_DELAY_MS) return;

    const leaderboard = await buildSeasonLeaderboard(season);

    // a name-based snapshot, independent of the User collection — the whole
    // point is that the underlying bets (and eventually users) can be
    // cleaned up afterwards without losing the historical standings
    await SeasonArchive.create({
      season,
      leaderboard: leaderboard.map(({ name, totalPoints, exactHits }) => ({
        name,
        totalPoints,
        exactHits,
      })),
    });

    await Bet.deleteMany({ season });
  } catch (error) {
    console.error(error);
  }
};
