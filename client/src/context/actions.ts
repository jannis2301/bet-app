import type {
  Bet,
  LeaderboardEntry,
  Match,
  PublicUser,
  SeasonArchiveEntry,
  SeasonArchiveSummary,
  User,
} from '../types';

// SETUP USER
export const SET_LOADING = 'SET_LOADING' as const;
export const SET_ERROR = 'SET_ERROR' as const;
export const SETUP_USER_SUCCESS = 'SETUP_USER_SUCCESS' as const;
export const UPDATE_USER_SUCCESS = 'UPDATE_USER_SUCCESS' as const;
export const UPDATE_PASSWORD_SUCCESS = 'UPDATE_PASSWORD_SUCCESS' as const;
export const FORGOT_PASSWORD_SUCCESS = 'FORGOT_PASSWORD_SUCCESS' as const;
export const RESET_PASSWORD_SUCCESS = 'RESET_PASSWORD_SUCCESS' as const;
export const GET_CURRENT_USER_BEGIN = 'GET_CURRENT_USER_BEGIN' as const;
export const GET_CURRENT_USER_SUCCESS = 'GET_CURRENT_USER_SUCCESS' as const;
export const GET_ALL_USERS = 'GET_ALL_USERS' as const;
export const GET_ALL_USER_BETS = 'GET_ALL_USER_BETS' as const;
// LOGOUT
export const LOGOUT_USER = 'LOGOUT_USER' as const;
// ALERT
export const DISPLAY_ALERT = 'DISPLAY_ALERT' as const;
export const CLEAR_ALERT = 'CLEAR_ALERT' as const;
export const HANDLE_CHANGE = 'HANDLE_CHANGE' as const;
export const CREATE_BET_SUCCESS = 'CREATE_BET_SUCCESS' as const;
// BUNDESLIGA MATCHES
export const SET_BUNDESLIGA_MATCHES = 'SET_BUNDESLIGA_MATCHES' as const;
export const GET_LEADERBOARD = 'GET_LEADERBOARD' as const;
export const GET_SEASON_LEADERBOARD = 'GET_SEASON_LEADERBOARD' as const;
// SEASON ARCHIVE
export const GET_ARCHIVED_SEASONS = 'GET_ARCHIVED_SEASONS' as const;
export const GET_SEASON_ARCHIVE = 'GET_SEASON_ARCHIVE' as const;

export type Action =
  | { type: typeof SET_LOADING }
  | { type: typeof SET_ERROR; payload: { msg: string } }
  | { type: typeof DISPLAY_ALERT }
  | { type: typeof CLEAR_ALERT }
  | {
      type: typeof SETUP_USER_SUCCESS;
      payload: { user: User; location?: string; alertText: string };
    }
  | { type: typeof LOGOUT_USER }
  | { type: typeof UPDATE_USER_SUCCESS; payload: { user: User } }
  | { type: typeof UPDATE_PASSWORD_SUCCESS }
  | { type: typeof FORGOT_PASSWORD_SUCCESS }
  | { type: typeof RESET_PASSWORD_SUCCESS; payload: { user: User } }
  | { type: typeof GET_CURRENT_USER_BEGIN }
  | {
      type: typeof GET_CURRENT_USER_SUCCESS;
      payload: { user: User | null; location?: string };
    }
  | { type: typeof HANDLE_CHANGE; payload: { name: string; value: string } }
  | { type: typeof CREATE_BET_SUCCESS }
  | { type: typeof GET_ALL_USER_BETS; payload: { userBets: Bet[] } }
  | {
      type: typeof SET_BUNDESLIGA_MATCHES;
      payload: {
        data: Match[];
        matchdayToFetch: number;
        currentMatchday: number;
      };
    }
  | {
      type: typeof GET_LEADERBOARD;
      payload: { leaderboard: LeaderboardEntry[] };
    }
  | {
      type: typeof GET_SEASON_LEADERBOARD;
      payload: { leaderboard: LeaderboardEntry[]; season: number };
    }
  | { type: typeof GET_ALL_USERS; payload: { users: PublicUser[] } }
  | {
      type: typeof GET_ARCHIVED_SEASONS;
      payload: { archivedSeasons: SeasonArchiveSummary[] };
    }
  | {
      type: typeof GET_SEASON_ARCHIVE;
      payload: { season: number; leaderboard: SeasonArchiveEntry[] };
    };
