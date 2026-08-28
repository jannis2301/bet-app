import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { BadRequestError } from '../errors/index.js';
import Bet from '../models/Bet.js';
import checkPermissions from '../utils/checkPermissions.js';
import type { OpenligaMatch } from '../utils/fetchMatches.js';
import * as fetchMatches from '../utils/fetchMatches.js';
import {
  buildSeasonLeaderboard,
  EXACT_HIT_POINTS,
  populateLeaderboard,
} from '../utils/leaderboard.js';
import { getCurrentSeason } from '../utils/season.js';

const ObjectId = mongoose.Types.ObjectId;

interface BetInput {
  matchID: number;
  matchDay: number;
  homeScore: number;
  awayScore: number;
}

const hasMatchStarted = (match?: OpenligaMatch) =>
  !match ||
  match.matchIsFinished ||
  new Date(match.matchDateTimeUTC) <= new Date();

export const setUserBets = async (req: Request, res: Response) => {
  const userIdParam = req.params.userId as string;
  checkPermissions(req.user as { userId: string }, userIdParam);
  const userId = new ObjectId(userIdParam);
  const bets = req.body as BetInput[];

  const matchdays = [...new Set(bets.map((bet) => bet.matchDay))];
  const matchesById = new Map<number, OpenligaMatch>();
  for (const matchday of matchdays) {
    const { matchData } = await fetchMatches.fetchBundesligaMatches(matchday);
    matchData?.forEach((match) => {
      matchesById.set(match.matchID, match);
    });
  }

  const season = getCurrentSeason();

  const operations = bets.map((bet) => {
    const { matchID, matchDay, homeScore, awayScore } = bet;
    if (
      matchID === undefined ||
      matchDay === undefined ||
      homeScore === undefined ||
      awayScore === undefined
    ) {
      throw new BadRequestError('Please Provide All Values');
    }
    if (homeScore < 0 || awayScore < 0) {
      throw new BadRequestError('Scores must be zero or greater');
    }
    if (hasMatchStarted(matchesById.get(matchID))) {
      throw new BadRequestError(
        `Match ${matchID} has already started, bet is locked`
      );
    }

    return {
      updateOne: {
        filter: { matchID, createdBy: userId },
        update: { $set: { matchDay, homeScore, awayScore, season } },
        upsert: true,
      },
    };
  });

  await Bet.bulkWrite(operations);
  res.status(StatusCodes.CREATED).json(bets);
};

export const getAllUserBetsByMatchday = async (req: Request, res: Response) => {
  const matchday = Number.parseInt(req.params.matchday as string, 10);
  if (Number.isNaN(matchday)) {
    throw new BadRequestError('Please provide a valid matchday');
  }

  const userBets = await Bet.find({
    matchDay: matchday,
    season: getCurrentSeason(),
  });

  const { matchData: matches } =
    await fetchMatches.fetchBundesligaMatches(matchday);
  const startedMatchIds = new Set(
    (matches ?? []).filter(hasMatchStarted).map((match) => match.matchID)
  );

  const visibleBets = userBets.filter(
    (bet) =>
      bet.createdBy.toString() === req.user?.userId ||
      startedMatchIds.has(bet.matchID)
  );

  res.status(StatusCodes.OK).json({ userBets: visibleBets });
};

export const getLeaderboard = async (req: Request, res: Response) => {
  const matchday = Number.parseInt(req.params.matchday as string, 10);
  if (Number.isNaN(matchday)) {
    throw new BadRequestError('Please provide a valid matchday');
  }

  const season = getCurrentSeason();
  const bets = await Bet.find({ matchDay: matchday, season });
  if (bets.length === 0) {
    return res
      .status(StatusCodes.OK)
      .json({ msg: `No bets have been placed for matchday ${matchday}!` });
  }

  const leaderboard = await Bet.aggregate([
    { $match: { matchDay: matchday, season } }, // Match specific matchday within the current season
    {
      $group: {
        _id: '$createdBy', // Group by the user who created the bet
        totalPoints: { $sum: '$pointsEarned' }, // Calculate total points
        exactHits: {
          $sum: { $cond: [{ $eq: ['$pointsEarned', EXACT_HIT_POINTS] }, 1, 0] },
        },
      },
    },
    { $sort: { totalPoints: -1, exactHits: -1 } },
  ]);

  res
    .status(StatusCodes.OK)
    .json({ leaderboard: await populateLeaderboard(leaderboard) });
};

export const getSeasonLeaderboard = async (req: Request, res: Response) => {
  const season = req.query.season
    ? Number.parseInt(req.query.season as string, 10)
    : getCurrentSeason();
  if (Number.isNaN(season)) {
    throw new BadRequestError('Please provide a valid season');
  }

  res.status(StatusCodes.OK).json({
    leaderboard: await buildSeasonLeaderboard(season),
    season,
  });
};
