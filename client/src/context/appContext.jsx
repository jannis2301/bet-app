import React, { useReducer, useContext, useEffect } from 'react'
import reducer from './reducer'
import axios from 'axios'

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
} from './actions'

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
}

const AppContext = React.createContext()

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  // axios
  const authFetch = axios.create({
    baseURL: '/api',
  })

  //response
  authFetch.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        logoutUser()
      }
      return Promise.reject(error)
    }
  )

  const displayAlert = () => {
    dispatch({ type: DISPLAY_ALERT })
    clearAlert()
  }

  const clearAlert = () => {
    setTimeout(() => {
      dispatch({ type: CLEAR_ALERT })
    }, 3000)
  }

  const setupUser = async ({ currentUser, endPoint, alertText }) => {
    dispatch({ type: SET_LOADING })
    try {
      const response = await axios.post(`/api/auth/${endPoint}`, currentUser)
      const { user, location } = response.data
      dispatch({
        type: SETUP_USER_SUCCESS,
        payload: { user, location, alertText },
      })
    } catch (error) {
      dispatch({
        type: SET_ERROR,
        payload: { msg: error.response.data.msg },
      })
    }
    clearAlert()
  }

  const logoutUser = async () => {
    await authFetch.get('/auth/logout')
    dispatch({ type: LOGOUT_USER })
  }

  const handleChange = ({ name, value }) => {
    dispatch({ type: HANDLE_CHANGE, payload: { name, value } })
  }

  const updateUser = async (currentUser) => {
    dispatch({ type: SET_LOADING })
    try {
      const { data } = await authFetch.patch('/auth/updateUser', currentUser)
      const { user } = data

      dispatch({
        type: UPDATE_USER_SUCCESS,
        payload: { user },
      })
    } catch (error) {
      if (error.response && error.response.status !== 401) {
        dispatch({
          type: SET_ERROR,
          payload: { msg: error.response.data.msg },
        })
      }
    }
    clearAlert()
  }

  const createBet = async (betsWithUser) => {
    dispatch({ type: SET_LOADING })
    try {
      await authFetch.post('/bets', betsWithUser)
      dispatch({ type: CREATE_BET_SUCCESS })
    } catch (error) {
      if (error.response && error.response.status === 401) return
      dispatch({
        type: SET_ERROR,
        payload: { msg: error.response.data.msg },
      })
    }
    clearAlert()
  }

  const getUserBets = async (userId) => {
    dispatch({ type: SET_LOADING })
    try {
      const { data } = await authFetch(`/bets/${userId}`)
      const { userBets } = data
      dispatch({
        type: GET_USER_BETS,
        payload: {
          userBets,
        },
      })
    } catch (error) {
      if (error.response && error.response.status === 401) return
      dispatch({
        type: SET_ERROR,
        payload: { msg: error.response.data.msg },
      })
    }
    clearAlert()
  }

  const getLeaderboard = async (matchday) => {
    dispatch({ type: SET_LOADING })
    try {
      const { data } = await authFetch(`/bets/leaderboard/${matchday}`)
      const { leaderboard } = data

      dispatch({
        type: GET_LEADERBOARD,
        payload: {
          leaderboard,
        },
      })
    } catch (error) {
      if (error.response && error.response.status === 401) return
      dispatch({
        type: SET_ERROR,
        payload: { msg: error.response.data.msg },
      })
    }
    clearAlert()
  }

  const getCurrentUser = async () => {
    dispatch({ type: GET_CURRENT_USER_BEGIN })
    try {
      const { data } = await authFetch('/auth/getCurrentUser')
      const { user, location } = data

      dispatch({
        type: GET_CURRENT_USER_SUCCESS,
        payload: {
          user,
          location,
        },
      })
    } catch (error) {
      if (error.response && error.response.status === 401) return
      logoutUser()
    }
  }

  const getAllUsers = async () => {
    dispatch({ type: SET_LOADING })
    try {
      const { data } = await authFetch('/auth/getAllUsers')
      const { users } = data

      dispatch({
        type: GET_ALL_USERS,
        payload: {
          users,
        },
      })
    } catch (error) {
      dispatch({
        type: SET_ERROR,
        payload: { msg: error },
      })
    }
  }

  const fetchBundesligaMatches = async (selectedMatchday) => {
    const matchDayURL = 'https://api.openligadb.de/getcurrentgroup/bl1'
    const getMatchesURL = 'https://api.openligadb.de/getmatchdata/bl1'

    let currentSeason =
      new Date().getMonth() > 6
        ? new Date().getFullYear()
        : new Date().getFullYear() - 1

    dispatch({ type: SET_LOADING })
    try {
      let matchdayToFetch
      let currentMatchday

      if (selectedMatchday) {
        switch (true) {
          case selectedMatchday < 1:
            matchdayToFetch = 34
            break
          case selectedMatchday > 34:
            matchdayToFetch = 1
            break
          default:
            matchdayToFetch = selectedMatchday
        }
      } else {
        const { data } = await axios.get(matchDayURL)
        matchdayToFetch = data.groupOrderID
      }

      const res = await axios.get(matchDayURL)
      currentMatchday = res.data.groupOrderID

      const { data } = await axios.get(
        `${getMatchesURL}/${currentSeason}/${matchdayToFetch}`
      )

      dispatch({
        type: SET_BUNDESLIGA_MATCHES,
        payload: {
          data,
          matchdayToFetch,
          currentMatchday,
        },
      })
    } catch (error) {
      dispatch({
        type: SET_ERROR,
        payload: { msg: error },
      })
    }
  }

  useEffect(() => {
    getCurrentUser()
    fetchBundesligaMatches()
  }, [])

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
  )
}

const useAppContext = () => {
  return useContext(AppContext)
}

export { AppProvider, initialState, useAppContext }
