import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { fetchBundesligaTable } from '../utils/fetchMatches.js';
import { getCurrentSeason } from '../utils/season.js';

export const getBundesligaTable = async (_req: Request, res: Response) => {
  const season = getCurrentSeason();
  const table = await fetchBundesligaTable(season);

  res.status(StatusCodes.OK).json({ table, season });
};
