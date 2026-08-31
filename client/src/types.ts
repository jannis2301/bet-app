export interface Team {
  teamId: number;
  shortName: string;
  teamIconUrl: string;
}

export interface MatchResult {
  pointsTeam1: number;
  pointsTeam2: number;
}

export interface Group {
  groupOrderID: number;
}

export interface Match {
  matchID: number;
  team1: Team;
  team2: Team;
  matchResults: MatchResult[];
  matchIsFinished: boolean;
  matchDateTime?: string;
  matchDateTimeUTC: string;
  group: Group;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  team: string;
  emailRemindersEnabled: boolean;
}

// Shape returned by GET /auth/getAllUsers, which only projects the fields
// needed to label other users' bets in the UI (see authController.ts).
export interface PublicUser {
  _id: string;
  name: string;
}

export interface Bet {
  _id?: string;
  matchID: number;
  matchDay: number;
  homeScore: number;
  awayScore: number;
  createdBy: string;
  pointsEarned?: number;
}

export interface LeaderboardEntry {
  _id: string;
  name: string;
  team: string;
  totalPoints: number;
  // number of exact-result bets (3-point hits) — tie-breaker when
  // totalPoints match, see betsController.ts's compareLeaderboardEntries
  exactHits: number;
}

export interface BundesligaTableEntry {
  teamInfoId: number;
  teamName: string;
  shortName: string;
  teamIconUrl: string;
  points: number;
  opponentGoals: number;
  goals: number;
  matches: number;
  won: number;
  lost: number;
  draw: number;
  goalDiff: number;
}

export interface SeasonArchiveSummary {
  season: number;
  archivedAt: string;
  entryCount: number;
}

export interface SeasonArchiveEntry {
  name: string;
  totalPoints: number;
  exactHits: number;
}

// PlaceBet's local form state: scores start out as an empty string until the
// user fills them in, unlike the numeric Bet shape the backend stores.
export interface BetFormEntry {
  matchID: number;
  matchDay: number;
  homeScore: number | '';
  awayScore: number | '';
}
