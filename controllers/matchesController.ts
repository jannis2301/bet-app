import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError } from '../errors/index.js';
import {
  fetchCurrentMatchday,
  fetchMatchdayData,
  MAX_MATCHDAY,
  MIN_MATCHDAY,
} from '../utils/fetchMatches.js';

export const getMatches = async (req: Request, res: Response) => {
  const { matchday } = req.query;

  let requestedMatchday: number | undefined;
  if (matchday !== undefined) {
    requestedMatchday = Number(matchday);
    if (!Number.isInteger(requestedMatchday)) {
      throw new BadRequestError('Please provide a valid matchday');
    }
  }

  // always resolved, regardless of which matchday is requested — the client
  // uses it to label "current matchday" independently of the page it's viewing
  const currentMatchday = await fetchCurrentMatchday();

  let matchdayToFetch: number;
  if (requestedMatchday === undefined) {
    matchdayToFetch = currentMatchday;
  } else if (requestedMatchday < MIN_MATCHDAY) {
    matchdayToFetch = MAX_MATCHDAY;
  } else if (requestedMatchday > MAX_MATCHDAY) {
    matchdayToFetch = MIN_MATCHDAY;
  } else {
    matchdayToFetch = requestedMatchday;
  }

  const matches = await fetchMatchdayData(matchdayToFetch);

  res.status(StatusCodes.OK).json({
    matches,
    matchday: matchdayToFetch,
    currentMatchday,
  });
};
