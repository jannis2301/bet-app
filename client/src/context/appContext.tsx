import axios from 'axios';
import type { ReactNode } from 'react';
import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import type {
  Bet,
  BetFormEntry,
  BundesligaTableEntry,
  LeaderboardEntry,
  Match,
  PublicUser,
  SeasonArchiveEntry,
  SeasonArchiveSummary,
  User,
} from '../types';
import sortMatchesByKickoff from '../utils/sortMatches';
import {
  CLEAR_ALERT,
  CREATE_BET_SUCCESS,
  DISPLAY_ALERT,
  FORGOT_PASSWORD_SUCCESS,
  GET_ALL_USER_BETS,
  GET_ALL_USERS,
  GET_ARCHIVED_SEASONS,
  GET_BUNDESLIGA_TABLE,
  GET_CURRENT_USER_BEGIN,
  GET_CURRENT_USER_SUCCESS,
  GET_LEADERBOARD,
  GET_SEASON_ARCHIVE,
  GET_SEASON_LEADERBOARD,
  HANDLE_CHANGE,
  LOGOUT_USER,
  REGISTER_PENDING_APPROVAL,
  RESET_PASSWORD_SUCCESS,
  SET_BUNDESLIGA_MATCHES,
  SET_ERROR,
  SET_LOADING,
  SETUP_USER_SUCCESS,
  UPDATE_PASSWORD_SUCCESS,
  UPDATE_USER_SUCCESS,
} from './actions';
import reducer from './reducer';

export interface AppState {
  userLoading: boolean;
  isLoading: boolean;
  showAlert: boolean;
  alertText: string;
  alertType: string;
  // get bundesliga data
  currentMatchday: number | '';
  bundesligaMatches: Match[];
  bundesligaMatchday: number | '';
  //create / update user
  user: User | null;
  userLocation?: string;
  jobLocation?: string;
  // bets
  allMatchdayBets: Bet[];
  leaderboard: LeaderboardEntry[];
  seasonLeaderboard: LeaderboardEntry[];
  seasonLeaderboardYear: number | '';
  bundesligaTable: BundesligaTableEntry[];
  bundesligaTableSeason: number | '';
  allUsers: PublicUser[];
  archivedSeasons: SeasonArchiveSummary[];
  selectedSeasonArchive: {
    season: number;
    leaderboard: SeasonArchiveEntry[];
  } | null;
}

export interface AppContextValue extends AppState {
  displayAlert: () => void;
  setupUser: (args: {
    currentUser: { name?: string; email: string; password: string };
    endPoint: string;
    alertText: string;
  }) => Promise<void>;
  logoutUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (args: { token: string; password: string }) => Promise<void>;
  handleChange: (args: { name: string; value: string }) => void;
  updateUser: (currentUser: {
    name: string;
    email: string;
    location: string;
    team: string;
  }) => Promise<void>;
  updatePassword: (args: {
    oldPassword: string;
    newPassword: string;
  }) => Promise<void>;
  createBet: (bets: BetFormEntry[], userId: string) => Promise<void>;
  getUserBetsByMatchday: (matchday: number | '') => Promise<void>;
  getAllUsers: () => Promise<void>;
  getLeaderboard: (matchday: number | '') => Promise<void>;
  getSeasonLeaderboard: () => Promise<void>;
  getBundesligaTable: () => Promise<void>;
  fetchBundesligaMatches: (selectedMatchday?: number | '') => Promise<void>;
  getArchivedSeasons: () => Promise<void>;
  getSeasonArchive: (season: number) => Promise<void>;
}

export const initialState: AppState = {
  userLoading: true,
  isLoading: false,
  showAlert: false,
  alertText: '',
  alertType: '',
  // get bundesliga data
  currentMatchday: '',
  bundesligaMatches: [],
  bundesligaMatchday: '',
  //create / update user
  user: null,
  // bets
  allMatchdayBets: [],
  leaderboard: [],
  seasonLeaderboard: [],
  seasonLeaderboardYear: '',
  bundesligaTable: [],
  bundesligaTableSeason: '',
  allUsers: [],
  archivedSeasons: [],
  selectedSeasonArchive: null,
};

const AppContext = React.createContext<AppContextValue | null>(null);

// created once at module scope so its identity never changes across renders —
// otherwise every useCallback depending on it (and every effect depending on those)
// loses memoization on every re-render of the provider
const authFetch = axios.create({
  baseURL: '/api',
});

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.msg || 'Something went wrong, please try again.'
    );
  }
  return 'Something went wrong, please try again.';
};

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const clearAlert = useCallback(() => {
    setTimeout(() => {
      dispatch({ type: CLEAR_ALERT });
    }, 3000);
  }, []);

  const displayAlert = useCallback(() => {
    dispatch({ type: DISPLAY_ALERT });
    clearAlert();
  }, [clearAlert]);

  const setupUser: AppContextValue['setupUser'] = useCallback(
    async ({ currentUser, endPoint, alertText }) => {
      dispatch({ type: SET_LOADING });
      try {
        const response = await axios.post<{
          user?: User;
          location?: string;
          pending?: boolean;
          msg?: string;
        }>(`/api/auth/${endPoint}`, currentUser);
        if (response.data.pending) {
          dispatch({
            type: REGISTER_PENDING_APPROVAL,
            payload: { msg: response.data.msg ?? alertText },
          });
        } else {
          const { user, location } = response.data as {
            user: User;
            location?: string;
          };
          dispatch({
            type: SETUP_USER_SUCCESS,
            payload: { user, location, alertText },
          });
        }
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
      clearAlert();
    },
    [clearAlert]
  );

  const logoutUser: AppContextValue['logoutUser'] = useCallback(async () => {
    await authFetch.get('/auth/logout');
    dispatch({ type: LOGOUT_USER });
  }, []);

  const forgotPassword: AppContextValue['forgotPassword'] = useCallback(
    async (email) => {
      dispatch({ type: SET_LOADING });
      try {
        await axios.post('/api/auth/forgot-password', { email });
        dispatch({ type: FORGOT_PASSWORD_SUCCESS });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
      clearAlert();
    },
    [clearAlert]
  );

  const resetPassword: AppContextValue['resetPassword'] = useCallback(
    async ({ token, password }) => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await axios.post<{ user: User }>(
          '/api/auth/reset-password',
          { token, password }
        );
        dispatch({
          type: RESET_PASSWORD_SUCCESS,
          payload: { user: data.user },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
      clearAlert();
    },
    [clearAlert]
  );

  useEffect(() => {
    const interceptorId = authFetch.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          logoutUser();
        }
        return Promise.reject(error);
      }
    );
    return () => authFetch.interceptors.response.eject(interceptorId);
  }, [logoutUser]);

  const handleChange: AppContextValue['handleChange'] = useCallback(
    ({ name, value }) => {
      dispatch({ type: HANDLE_CHANGE, payload: { name, value } });
    },
    []
  );

  const updateUser: AppContextValue['updateUser'] = useCallback(
    async (currentUser) => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch.patch<{ user: User }>(
          '/auth/updateUser',
          currentUser
        );
        const { user } = data;

        dispatch({
          type: UPDATE_USER_SUCCESS,
          payload: { user },
        });
      } catch (error) {
        if (!(axios.isAxiosError(error) && error.response?.status === 401)) {
          dispatch({
            type: SET_ERROR,
            payload: { msg: getErrorMessage(error) },
          });
        }
      }
      clearAlert();
    },
    [clearAlert]
  );

  const updatePassword: AppContextValue['updatePassword'] = useCallback(
    async ({ oldPassword, newPassword }) => {
      dispatch({ type: SET_LOADING });
      try {
        await authFetch.patch('/auth/updatePassword', {
          oldPassword,
          newPassword,
        });
        dispatch({ type: UPDATE_PASSWORD_SUCCESS });
      } catch (error) {
        if (!(axios.isAxiosError(error) && error.response?.status === 401)) {
          dispatch({
            type: SET_ERROR,
            payload: { msg: getErrorMessage(error) },
          });
        }
      }
      clearAlert();
    },
    [clearAlert]
  );

  const createBet: AppContextValue['createBet'] = useCallback(
    async (bets, userId) => {
      dispatch({ type: SET_LOADING });
      try {
        await authFetch.post(`/bets/user/${userId}`, bets);
        dispatch({ type: CREATE_BET_SUCCESS });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
      clearAlert();
    },
    [clearAlert]
  );

  const getUserBetsByMatchday: AppContextValue['getUserBetsByMatchday'] =
    useCallback(async (matchday) => {
      dispatch({ type: SET_LOADING });
      if (!matchday) return;
      try {
        const { data } = await authFetch<{ userBets: Bet[] }>(
          `/bets/user/${matchday}`
        );
        const { userBets } = data;

        dispatch({
          type: GET_ALL_USER_BETS,
          payload: {
            userBets,
          },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
    }, []);

  const getLeaderboard: AppContextValue['getLeaderboard'] = useCallback(
    async (matchday) => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch<{ leaderboard?: LeaderboardEntry[] }>(
          `/bets/leaderboard/${matchday}`
        );

        dispatch({
          type: GET_LEADERBOARD,
          payload: {
            leaderboard: data.leaderboard ?? [],
          },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
    },
    []
  );

  const getSeasonLeaderboard: AppContextValue['getSeasonLeaderboard'] =
    useCallback(async () => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch<{
          leaderboard: LeaderboardEntry[];
          season: number;
        }>('/bets/leaderboard/season');
        const { leaderboard, season } = data;

        dispatch({
          type: GET_SEASON_LEADERBOARD,
          payload: {
            leaderboard,
            season,
          },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
    }, []);

  const getBundesligaTable: AppContextValue['getBundesligaTable'] =
    useCallback(async () => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch<{
          table: BundesligaTableEntry[];
          season: number;
        }>('/table');

        dispatch({
          type: GET_BUNDESLIGA_TABLE,
          payload: { table: data.table, season: data.season },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
    }, []);

  const getCurrentUser = useCallback(async () => {
    dispatch({ type: GET_CURRENT_USER_BEGIN });
    try {
      const { data } = await authFetch<{
        user: User | null;
        location?: string;
      }>('/auth/getCurrentUser');
      const { user, location } = data;

      dispatch({
        type: GET_CURRENT_USER_SUCCESS,
        payload: {
          user,
          location,
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) return;
      logoutUser();
    }
  }, [logoutUser]);

  const getAllUsers: AppContextValue['getAllUsers'] = useCallback(async () => {
    dispatch({ type: SET_LOADING });
    try {
      const { data } = await authFetch<{ users: PublicUser[] }>(
        '/auth/getAllUsers'
      );
      const { users } = data;

      dispatch({
        type: GET_ALL_USERS,
        payload: {
          users,
        },
      });
    } catch (error) {
      dispatch({
        type: SET_ERROR,
        payload: { msg: getErrorMessage(error) },
      });
    }
  }, []);

  const getArchivedSeasons: AppContextValue['getArchivedSeasons'] =
    useCallback(async () => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch<{
          archives: SeasonArchiveSummary[];
        }>('/archive');

        dispatch({
          type: GET_ARCHIVED_SEASONS,
          payload: { archivedSeasons: data.archives },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
    }, []);

  const getSeasonArchive: AppContextValue['getSeasonArchive'] = useCallback(
    async (season) => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch<{
          season: number;
          leaderboard: SeasonArchiveEntry[];
        }>(`/archive/${season}`);

        dispatch({
          type: GET_SEASON_ARCHIVE,
          payload: { season: data.season, leaderboard: data.leaderboard },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
    },
    []
  );

  const fetchBundesligaMatches: AppContextValue['fetchBundesligaMatches'] =
    useCallback(async (selectedMatchday) => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch.get<{
          matches: Match[];
          matchday: number;
          currentMatchday: number;
        }>('/matches', {
          params: selectedMatchday ? { matchday: selectedMatchday } : undefined,
        });

        dispatch({
          type: SET_BUNDESLIGA_MATCHES,
          payload: {
            data: sortMatchesByKickoff(data.matches),
            matchdayToFetch: data.matchday,
            currentMatchday: data.currentMatchday,
          },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: getErrorMessage(error) },
        });
      }
    }, []);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        displayAlert,
        setupUser,
        logoutUser,
        forgotPassword,
        resetPassword,
        handleChange,
        updateUser,
        updatePassword,
        createBet,
        getUserBetsByMatchday,
        getAllUsers,
        getLeaderboard,
        getSeasonLeaderboard,
        getBundesligaTable,
        fetchBundesligaMatches,
        getArchivedSeasons,
        getSeasonArchive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = (): AppContextValue => {
  // AppProvider always wraps the app (see index.tsx), so the context value
  // is never actually null at the point any component calls this hook.
  return useContext(AppContext) as AppContextValue;
};

export { AppProvider, useAppContext };
