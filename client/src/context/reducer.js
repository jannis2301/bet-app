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

import { initialState } from './appContext'

const reducer = (state, action) => {
  if (action.type === SET_LOADING) {
    return { ...state, isLoading: true }
  }

  if (action.type === SET_ERROR) {
    return {
      ...state,
      isLoading: false,
      showAlert: true,
      alertType: 'danger',
      alertText: action.payload.msg,
    }
  }

  if (action.type === DISPLAY_ALERT) {
    return {
      ...state,
      showAlert: true,
      alertType: 'danger',
      alertText: 'Please provide all values!',
    }
  }

  if (action.type === CLEAR_ALERT) {
    return {
      ...state,
      showAlert: false,
      alertType: '',
      alertText: '',
    }
  }

  if (action.type === SETUP_USER_SUCCESS) {
    const { user, location, alertText } = action.payload
    return {
      ...state,
      isLoading: false,
      user,
      userLocation: location,
      showAlert: true,
      alertType: 'success',
      alertText,
    }
  }

  if (action.type === LOGOUT_USER) {
    return {
      ...initialState,
      userLoading: false,
    }
  }

  if (action.type === UPDATE_USER_SUCCESS) {
    return {
      ...state,
      isLoading: false,
      user: action.payload.user,
      showAlert: true,
      alertType: 'success',
      alertText: 'User Profile Updated!',
    }
  }

  if (action.type === GET_CURRENT_USER_BEGIN) {
    return {
      ...state,
      userLoading: true,
      showAlert: false,
    }
  }

  if (action.type === GET_CURRENT_USER_SUCCESS) {
    const { user, location } = action.payload
    return {
      ...state,
      userLoading: false,
      user,
      userLocation: location,
      jobLocation: location,
    }
  }

  if (action.type === HANDLE_CHANGE) {
    const { name, value } = action.payload
    return {
      ...state,
      [name]: value,
    }
  }

  if (action.type === CREATE_BET_SUCCESS) {
    return {
      ...state,
      isLoading: false,
      showAlert: true,
      alertType: 'success',
      alertText: 'Bets placed!',
    }
  }

  if (action.type === GET_USER_BETS) {
    return {
      ...state,
      isLoading: false,
      allBetsPlaced: action.payload.userBets,
    }
  }

  if (action.type === SET_BUNDESLIGA_MATCHES) {
    const { data, matchdayToFetch, currentMatchday } = action.payload
    return {
      ...state,
      isLoading: false,
      bundesligaMatches: data,
      bundesligaMatchday: matchdayToFetch,
      currentMatchday: currentMatchday,
    }
  }

  if (action.type === GET_LEADERBOARD) {
    return {
      ...state,
      isLoading: false,
      leaderboard: action.payload.leaderboard,
    }
  }

  if (action.type === GET_ALL_USERS) {
    return {
      ...state,
      isLoading: false,
      allUsers: action.payload.users,
    }
  }

  throw new Error(`no such action: ${action.type}`)
}

export default reducer
