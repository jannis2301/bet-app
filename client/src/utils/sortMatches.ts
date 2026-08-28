import type { Match } from '../types';

// openligadb doesn't guarantee kickoff-time order (e.g. after a match gets
// rescheduled), so the matchday view sorts explicitly before displaying it.
const sortMatchesByKickoff = (matches: Match[]): Match[] =>
  [...matches].sort(
    (a, b) =>
      new Date(a.matchDateTimeUTC).getTime() -
      new Date(b.matchDateTimeUTC).getTime()
  );

export default sortMatchesByKickoff;
