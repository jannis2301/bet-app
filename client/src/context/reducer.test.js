import { describe, expect, it } from 'vitest';
import {
  CLEAR_ALERT,
  GET_LEADERBOARD,
  GET_SEASON_LEADERBOARD,
  LOGOUT_USER,
  SET_ERROR,
  SET_LOADING,
} from './actions';
import { initialState } from './appContext';
import reducer from './reducer';

describe('reducer', () => {
  it('sets isLoading on SET_LOADING', () => {
    const state = reducer(initialState, { type: SET_LOADING });
    expect(state.isLoading).toBe(true);
  });

  it('shows a danger alert with the given message on SET_ERROR', () => {
    const state = reducer(initialState, {
      type: SET_ERROR,
      payload: { msg: 'Something broke' },
    });
    expect(state).toMatchObject({
      isLoading: false,
      showAlert: true,
      alertType: 'danger',
      alertText: 'Something broke',
    });
  });

  it('clears the alert on CLEAR_ALERT', () => {
    const withAlert = {
      ...initialState,
      showAlert: true,
      alertType: 'danger',
      alertText: 'oops',
    };
    const state = reducer(withAlert, { type: CLEAR_ALERT });
    expect(state).toMatchObject({
      showAlert: false,
      alertType: '',
      alertText: '',
    });
  });

  it('resets to initialState on LOGOUT_USER but stops the user-loading spinner', () => {
    const loggedInState = {
      ...initialState,
      user: { name: 'Alice' },
      leaderboard: [{ name: 'Alice', totalPoints: 3 }],
    };
    const state = reducer(loggedInState, { type: LOGOUT_USER });
    expect(state).toEqual({ ...initialState, userLoading: false });
  });

  it('stores the matchday leaderboard on GET_LEADERBOARD', () => {
    const leaderboard = [{ _id: '1', name: 'Alice', totalPoints: 3 }];
    const state = reducer(initialState, {
      type: GET_LEADERBOARD,
      payload: { leaderboard },
    });
    expect(state.leaderboard).toBe(leaderboard);
    expect(state.isLoading).toBe(false);
  });

  it('stores the season leaderboard and its season year on GET_SEASON_LEADERBOARD', () => {
    const leaderboard = [{ _id: '1', name: 'Alice', totalPoints: 10 }];
    const state = reducer(initialState, {
      type: GET_SEASON_LEADERBOARD,
      payload: { leaderboard, season: 2025 },
    });
    expect(state.seasonLeaderboard).toBe(leaderboard);
    expect(state.seasonLeaderboardYear).toBe(2025);
  });

  it('throws for an unknown action type', () => {
    expect(() => reducer(initialState, { type: 'NOT_A_REAL_ACTION' })).toThrow(
      /no such action/
    );
  });
});
