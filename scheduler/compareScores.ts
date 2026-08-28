import Bet from '../models/Bet.js';
import type { OpenligaMatch } from '../utils/fetchMatches.js';
import { fetchBundesligaMatches } from '../utils/fetchMatches.js';
import { getCurrentSeason } from '../utils/season.js';

const FINAL_RESULT_TYPE_ID = 2;

const getFinalResult = (match: OpenligaMatch) =>
  match.matchResults.find(
    (result) => result.resultTypeID === FINAL_RESULT_TYPE_ID
  );

const calculatePoints = (
  bet: { homeScore: number; awayScore: number },
  homeScore: number,
  awayScore: number
): number => {
  if (bet.homeScore === homeScore && bet.awayScore === awayScore) return 3;

  const predictedWinning =
    bet.homeScore > bet.awayScore
      ? 'home'
      : bet.homeScore < bet.awayScore
        ? 'away'
        : 'draw';
  const actualWinning =
    homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';

  return predictedWinning === actualWinning ? 1 : 0;
};

export const compareScores = async (): Promise<void> => {
  try {
    const { matchData: matches, matchdayToFetch: matchday } =
      await fetchBundesligaMatches();

    if (!matches || matches.length === 0) return;

    const allMatchesHaveFinished = matches.every(
      (match) => match.matchIsFinished
    );
    if (!allMatchesHaveFinished) return;

    const matchdayBets = await Bet.find({
      matchDay: matchday,
      season: getCurrentSeason(),
    });

    const operations = matchdayBets.flatMap((bet) => {
      const correspondingMatch = matches.find(
        (match) => match.matchID === bet.matchID
      );
      if (!correspondingMatch) return [];

      const finalResult = getFinalResult(correspondingMatch);
      if (!finalResult) return [];

      const { pointsTeam1: homeScore, pointsTeam2: awayScore } = finalResult;
      const pointsEarned = calculatePoints(bet, homeScore, awayScore);

      return [
        {
          updateOne: {
            filter: { _id: bet._id },
            update: { $set: { pointsEarned } },
          },
        },
      ];
    });

    if (operations.length > 0) {
      await Bet.bulkWrite(operations);
    }
  } catch (error) {
    console.error(error);
  }
};
