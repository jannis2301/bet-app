import {
  type Action,
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
import type { AppState } from './appContext';
import { initialState } from './appContext';

const reducer = (state: AppState, action: Action): AppState => {
  if (action.type === SET_LOADING) {
    return { ...state, isLoading: true };
  }

  if (action.type === SET_ERROR) {
    return {
      ...state,
      isLoading: false,
      showAlert: true,
      alertType: 'danger',
      alertText: action.payload.msg,
    };
  }

  if (action.type === DISPLAY_ALERT) {
    return {
      ...state,
      showAlert: true,
      alertType: 'danger',
      alertText: 'Please provide all values!',
    };
  }

  if (action.type === CLEAR_ALERT) {
    return {
      ...state,
      showAlert: false,
      alertType: '',
      alertText: '',
    };
  }

  if (action.type === SETUP_USER_SUCCESS) {
    const { user, location, alertText } = action.payload;
    return {
      ...state,
      isLoading: false,
      user,
      userLocation: location,
      showAlert: true,
      alertType: 'success',
      alertText,
    };
  }

  if (action.type === REGISTER_PENDING_APPROVAL) {
    return {
      ...state,
      isLoading: false,
      showAlert: true,
      alertType: 'success',
      alertText: action.payload.msg,
    };
  }

  if (action.type === LOGOUT_USER) {
    return {
      ...initialState,
      userLoading: false,
    };
  }

  if (action.type === UPDATE_USER_SUCCESS) {
    return {
      ...state,
      isLoading: false,
      user: action.payload.user,
      showAlert: true,
      alertType: 'success',
      alertText: 'User Profile Updated!',
    };
  }

  if (action.type === UPDATE_PASSWORD_SUCCESS) {
    return {
      ...state,
      isLoading: false,
      showAlert: true,
      alertType: 'success',
      alertText: 'Password updated successfully!',
    };
  }

  if (action.type === FORGOT_PASSWORD_SUCCESS) {
    return {
      ...state,
      isLoading: false,
      showAlert: true,
      alertType: 'success',
      alertText:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  if (action.type === RESET_PASSWORD_SUCCESS) {
    return {
      ...state,
      isLoading: false,
      user: action.payload.user,
      showAlert: true,
      alertType: 'success',
      alertText: 'Password reset successful! Redirecting...',
    };
  }

  if (action.type === GET_CURRENT_USER_BEGIN) {
    return {
      ...state,
      userLoading: true,
      showAlert: false,
    };
  }

  if (action.type === GET_CURRENT_USER_SUCCESS) {
    const { user, location } = action.payload;
    return {
      ...state,
      userLoading: false,
      user,
      userLocation: location,
      jobLocation: location,
    };
  }

  if (action.type === HANDLE_CHANGE) {
    const { name, value } = action.payload;
    return {
      ...state,
      [name]: value,
    };
  }

  if (action.type === CREATE_BET_SUCCESS) {
    return {
      ...state,
      isLoading: false,
      showAlert: true,
      alertType: 'success',
      alertText: 'Bets placed!',
    };
  }

  if (action.type === GET_ALL_USER_BETS) {
    return {
      ...state,
      isLoading: false,
      allMatchdayBets: action.payload.userBets,
    };
  }

  if (action.type === SET_BUNDESLIGA_MATCHES) {
    const { data, matchdayToFetch, currentMatchday } = action.payload;
    return {
      ...state,
      isLoading: false,
      bundesligaMatches: data,
      bundesligaMatchday: matchdayToFetch,
      currentMatchday: currentMatchday,
    };
  }

  if (action.type === GET_LEADERBOARD) {
    return {
      ...state,
      isLoading: false,
      leaderboard: action.payload.leaderboard,
    };
  }

  if (action.type === GET_SEASON_LEADERBOARD) {
    return {
      ...state,
      isLoading: false,
      seasonLeaderboard: action.payload.leaderboard,
      seasonLeaderboardYear: action.payload.season,
    };
  }

  if (action.type === GET_BUNDESLIGA_TABLE) {
    return {
      ...state,
      isLoading: false,
      bundesligaTable: action.payload.table,
      bundesligaTableSeason: action.payload.season,
    };
  }

  if (action.type === GET_ALL_USERS) {
    return {
      ...state,
      isLoading: false,
      allUsers: action.payload.users,
    };
  }

  if (action.type === GET_ARCHIVED_SEASONS) {
    return {
      ...state,
      isLoading: false,
      archivedSeasons: action.payload.archivedSeasons,
    };
  }

  if (action.type === GET_SEASON_ARCHIVE) {
    return {
      ...state,
      isLoading: false,
      selectedSeasonArchive: {
        season: action.payload.season,
        leaderboard: action.payload.leaderboard,
      },
    };
  }

  throw new Error(`no such action: ${(action as { type: string }).type}`);
};

export default reducer;
