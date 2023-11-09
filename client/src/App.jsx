import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Error, ProtectedRoute, Register } from './pages'
import {
  MyBets,
  Home,
  Layout,
  Leaderboard,
  PlaceBet,
  Profile,
  UserBets,
} from './pages/dashboard'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="/placebet" element={<PlaceBet />} />
          <Route path="/bets/:userId" element={<UserBets />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<Error />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
