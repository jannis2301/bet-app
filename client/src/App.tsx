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
  Home,
  Layout,
  Leaderboard,
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
          <Route index element={<Home />} />
          <Route path="/placebet" element={<PlaceBet />} />
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
