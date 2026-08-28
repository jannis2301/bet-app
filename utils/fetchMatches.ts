import axios from 'axios';
import { getCurrentSeason } from './season.js';

const BASE_URL = 'https://api.openligadb.de';
// Prevents a stalled OpenligaDB request from hanging the cron job or an
// HTTP request indefinitely (axios has no timeout by default).
const REQUEST_TIMEOUT_MS = 10_000;

export const MIN_MATCHDAY = 1;
export const MAX_MATCHDAY = 34;

export interface MatchResult {
  pointsTeam1: number;
  pointsTeam2: number;
  // 1 = Halbzeitergebnis, 2 = Endergebnis (see OpenligaDB API)
  resultTypeID: number;
}

export interface Team {
  teamId: number;
  shortName: string;
  teamIconUrl: string;
}

export interface MatchGroup {
  groupOrderID: number;
}

export interface OpenligaMatch {
  matchID: number;
  team1: Team;
  team2: Team;
  // naive (already-local) kickoff time, as opposed to matchDateTimeUTC
  matchDateTime?: string;
  matchDateTimeUTC: string;
  matchIsFinished: boolean;
  matchResults: MatchResult[];
  group: MatchGroup;
}

interface CurrentGroup {
  groupOrderID: number;
}

export const fetchCurrentMatchday = async (): Promise<number> => {
  const { data } = await axios.get<CurrentGroup>(
    `${BASE_URL}/getcurrentgroup/bl1`,
    { timeout: REQUEST_TIMEOUT_MS }
  );
  return data.groupOrderID;
};

export const fetchMatchdayData = async (
  matchday: number
): Promise<OpenligaMatch[]> => {
  const currentSeason = getCurrentSeason();
  const { data } = await axios.get<OpenligaMatch[]>(
    `${BASE_URL}/getmatchdata/bl1/${currentSeason}/${matchday}`,
    { timeout: REQUEST_TIMEOUT_MS }
  );
  return data;
};

export const fetchBundesligaMatches = async (
  selectedMatchday?: number
): Promise<{ matchData: OpenligaMatch[]; matchdayToFetch: number }> => {
  const matchdayToFetch =
    selectedMatchday &&
    selectedMatchday >= MIN_MATCHDAY &&
    selectedMatchday <= MAX_MATCHDAY
      ? selectedMatchday
      : await fetchCurrentMatchday();

  const matchData = await fetchMatchdayData(matchdayToFetch);
  return { matchData, matchdayToFetch };
};
