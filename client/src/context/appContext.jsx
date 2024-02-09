import React, { useReducer, useContext, useEffect, useCallback } from 'react';
import reducer from './reducer';
import axios from 'axios';

import {
  SET_LOADING,
  SET_ERROR,
  SETUP_USER_SUCCESS,
  LOGOUT_USER,
  DISPLAY_ALERT,
  CLEAR_ALERT,
  GET_CURRENT_USER_BEGIN,
  GET_CURRENT_USER_SUCCESS,
  GET_ALL_USERS,
  HANDLE_CHANGE,
  UPDATE_USER_SUCCESS,
  CREATE_BET_SUCCESS,
  GET_USER_BETS,
  SET_BUNDESLIGA_MATCHES,
  GET_LEADERBOARD,
} from './actions';

const initialState = {
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
  currentBets: [],
  allBetsPlaced: [],
  leaderboard: [],
  allUsers: [],
};

const AppContext = React.createContext();

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // axios
  const authFetch = axios.create({
    baseURL: '/api',
  });

  //response
  authFetch.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        logoutUser();
      }
      return Promise.reject(error);
    }
  );

  const clearAlert = useCallback(() => {
    setTimeout(() => {
      dispatch({ type: CLEAR_ALERT });
    }, 3000);
  }, [dispatch]);

  const displayAlert = useCallback(() => {
    dispatch({ type: DISPLAY_ALERT });
    clearAlert();
  }, [dispatch, clearAlert]);

  const setupUser = useCallback(
    async ({ currentUser, endPoint, alertText }) => {
      dispatch({ type: SET_LOADING });
      try {
        const response = await axios.post(`/api/auth/${endPoint}`, currentUser);
        const { user, location } = response.data;
        dispatch({
          type: SETUP_USER_SUCCESS,
          payload: { user, location, alertText },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: error.response.data.msg },
        });
      }
      clearAlert();
    },
    [dispatch, clearAlert]
  );

  const logoutUser = useCallback(async () => {
    await authFetch.get('/auth/logout');
    dispatch({ type: LOGOUT_USER });
  }, [dispatch, authFetch]);

  const handleChange = useCallback(
    ({ name, value }) => {
      dispatch({ type: HANDLE_CHANGE, payload: { name, value } });
    },
    [dispatch]
  );

  const updateUser = useCallback(
    async (currentUser) => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch.patch('/auth/updateUser', currentUser);
        const { user } = data;

        dispatch({
          type: UPDATE_USER_SUCCESS,
          payload: { user },
        });
      } catch (error) {
        if (error.response && error.response.status !== 401) {
          dispatch({
            type: SET_ERROR,
            payload: { msg: error.response.data.msg },
          });
        }
      }
      clearAlert();
    },
    [dispatch, clearAlert, authFetch]
  );

  const createBet = useCallback(
    async (bets, userId) => {
      dispatch({ type: SET_LOADING });
      try {
        await authFetch.post(`/bets/user/${userId}`, bets);
        dispatch({ type: CREATE_BET_SUCCESS });
      } catch (error) {
        if (error.response && error.response.status === 401) return;
        dispatch({
          type: SET_ERROR,
          payload: { msg: error.response.data.msg },
        });
      }
      clearAlert();
    },
    [dispatch, clearAlert, authFetch]
  );

  const getUserBets = useCallback(
    async (userId) => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch(`/bets/user/${userId}`);
        const { userBets } = data;
        dispatch({
          type: GET_USER_BETS,
          payload: {
            userBets,
          },
        });
      } catch (error) {
        if (error.response && error.response.status === 401) return;
        dispatch({
          type: SET_ERROR,
          payload: { msg: error.response.data.msg },
        });
      }
      clearAlert();
    },
    [dispatch, clearAlert, authFetch]
  );

  const getLeaderboard = useCallback(
    async (matchday) => {
      dispatch({ type: SET_LOADING });
      try {
        const { data } = await authFetch(`/bets/leaderboard/${matchday}`);
        const { leaderboard } = data;

        dispatch({
          type: GET_LEADERBOARD,
          payload: {
            leaderboard,
          },
        });
      } catch (error) {
        if (error.response && error.response.status === 401) return;
        dispatch({
          type: SET_ERROR,
          payload: { msg: error.response.data.msg },
        });
      }
      clearAlert();
    },
    [dispatch, authFetch]
  );

  const getCurrentUser = useCallback(async () => {
    dispatch({ type: GET_CURRENT_USER_BEGIN });
    try {
      const { data } = await authFetch('/auth/getCurrentUser');
      const { user, location } = data;

      dispatch({
        type: GET_CURRENT_USER_SUCCESS,
        payload: {
          user,
          location,
        },
      });
    } catch (error) {
      if (error.response && error.response.status === 401) return;
      logoutUser();
    }
  }, [dispatch, logoutUser, authFetch]);

  const getAllUsers = useCallback(async () => {
    dispatch({ type: SET_LOADING });
    try {
      const { data } = await authFetch('/auth/getAllUsers');
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
        payload: { msg: error },
      });
    }
  }, [dispatch, authFetch]);

  const fetchBundesligaMatches = useCallback(
    async (selectedMatchday) => {
      const matchDayURL = 'https://api.openligadb.de/getcurrentgroup/bl1';
      const getMatchesURL = 'https://api.openligadb.de/getmatchdata/bl1';
      const date = new Date();
      const getCurrentMonth = date.getMonth();
      const getCurrentYear = date.getFullYear();
      const MIN_MATCHDAYS = 1;
      const MAX_MATCHDAYS = 34;

      let currentSeason =
        getCurrentMonth > 6 ? getCurrentYear : getCurrentYear - 1;

      dispatch({ type: SET_LOADING });
      try {
        let matchdayToFetch;
        let currentMatchday;
        if (selectedMatchday) {
          switch (true) {
            case selectedMatchday < MIN_MATCHDAYS:
              matchdayToFetch = MAX_MATCHDAYS;
              break;
            case selectedMatchday > MAX_MATCHDAYS:
              matchdayToFetch = MIN_MATCHDAYS;
              break;
            default:
              matchdayToFetch = selectedMatchday;
          }
        } else {
          const { data } = await axios.get(matchDayURL);
          matchdayToFetch = data.groupOrderID;
        }

        const res = await axios.get(matchDayURL);
        currentMatchday = res.data.groupOrderID;

        const { data } = await axios.get(
          `${getMatchesURL}/${currentSeason}/${matchdayToFetch}`
        );

        dispatch({
          type: SET_BUNDESLIGA_MATCHES,
          payload: {
            data,
            matchdayToFetch,
            currentMatchday,
          },
        });
      } catch (error) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: error },
        });
      }
    },
    [dispatch]
  );

  useEffect(() => {
    getCurrentUser();
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        displayAlert,
        setupUser,
        logoutUser,
        handleChange,
        updateUser,
        createBet,
        getUserBets,
        getAllUsers,
        getLeaderboard,
        fetchBundesligaMatches,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => {
  return useContext(AppContext);
};

export { AppProvider, initialState, useAppContext };
