import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import SeasonArchive from '../models/SeasonArchive.js';
import { generateLeaderboardPdf } from '../utils/generateLeaderboardPdf.js';

const parseSeason = (value: unknown): number => {
  const season = Number.parseInt(value as string, 10);
  if (Number.isNaN(season)) {
    throw new BadRequestError('Please provide a valid season');
  }
  return season;
};

export const getArchivedSeasons = async (_req: Request, res: Response) => {
  const archives = await SeasonArchive.find()
    .select('season archivedAt leaderboard')
    .sort({ season: -1 });

  res.status(StatusCodes.OK).json({
    archives: archives.map((archive) => ({
      season: archive.season,
      archivedAt: archive.archivedAt,
      entryCount: archive.leaderboard.length,
    })),
  });
};

export const getSeasonArchive = async (req: Request, res: Response) => {
  const season = parseSeason(req.params.season);

  const archive = await SeasonArchive.findOne({ season });
  if (!archive) {
    throw new NotFoundError(`No archive found for season ${season}`);
  }

  res.status(StatusCodes.OK).json({
    season: archive.season,
    archivedAt: archive.archivedAt,
    leaderboard: archive.leaderboard,
  });
};

export const downloadSeasonArchivePdf = async (req: Request, res: Response) => {
  const season = parseSeason(req.params.season);

  const archive = await SeasonArchive.findOne({ season });
  if (!archive) {
    throw new NotFoundError(`No archive found for season ${season}`);
  }

  const pdf = await generateLeaderboardPdf(season, archive.leaderboard);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="saison-${season}-${season + 1}-endtabelle.pdf"`
  );
  res.status(StatusCodes.OK).send(pdf);
};
