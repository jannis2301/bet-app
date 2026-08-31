import type mongoose from 'mongoose';
import Bet from '../models/Bet.js';
import User from '../models/User.js';

// matches the 3-point exact-result score awarded in compareScores.ts's
// calculatePoints — kept as a local constant since that module doesn't
// export one
export const EXACT_HIT_POINTS = 3;

export interface LeaderboardEntry {
  _id: mongoose.Types.ObjectId;
  name: string;
  team: string;
  totalPoints: number;
  exactHits: number;
}

// Tie-breaker rule: total points, then number of exact-result hits, then
// name (guarantees a fully deterministic order instead of leaving ties in
// whatever order Mongo happens to return them in).
const compareLeaderboardEntries = (
  a: { totalPoints: number; exactHits: number; name: string },
  b: { totalPoints: number; exactHits: number; name: string }
) =>
  b.totalPoints - a.totalPoints ||
  b.exactHits - a.exactHits ||
  a.name.localeCompare(b.name);

// Resolves user details for each aggregated leader, skipping deleted users
export const populateLeaderboard = async (
  leaders: {
    _id: mongoose.Types.ObjectId;
    totalPoints: number;
    exactHits: number;
  }[]
): Promise<LeaderboardEntry[]> =>
  (
    await Promise.all(
      leaders.map(async (leader) => {
        const user = await User.findById(leader._id);
        if (!user) return null;
        return {
          _id: leader._id,
          name: user.name,
          team: user.team,
          totalPoints: leader.totalPoints,
          exactHits: leader.exactHits,
        };
      })
    )
  )
    .filter((entry) => entry !== null)
    .sort(compareLeaderboardEntries);

// Aggregates every bet in a season into a final, tie-broken leaderboard —
// shared by the live season leaderboard endpoint and the end-of-season
// archiver, so both use exactly the same ranking rule.
export const buildSeasonLeaderboard = async (
  season: number
): Promise<LeaderboardEntry[]> => {
  const leaders = await Bet.aggregate([
    { $match: { season } },
    {
      $group: {
        _id: '$createdBy',
        totalPoints: { $sum: '$pointsEarned' },
        exactHits: {
          $sum: { $cond: [{ $eq: ['$pointsEarned', EXACT_HIT_POINTS] }, 1, 0] },
        },
      },
    },
  ]);
  return populateLeaderboard(leaders);
};
