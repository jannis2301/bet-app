import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  ErrorPage,
  ForgotPassword,
  ProtectedRoute,
  Register,
  ResetPassword,
} from './pages';
import {
  BundesligaTable,
  Layout,
  Leaderboard,
  Matchday,
  PastSeasons,
  PlaceBet,
  Profile,
  UserBets,
} from './pages/dashboard';

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
          <Route index element={<PlaceBet />} />
          <Route path="/matchday" element={<Matchday />} />
          <Route path="/bets" element={<UserBets />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/bundesliga-table" element={<BundesligaTable />} />
          <Route path="/past-seasons" element={<PastSeasons />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
