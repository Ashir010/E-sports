import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import { ProtectedRoute, AdminRoute } from './layouts/RouteGuards.jsx';
import Home from './pages/public/Home.jsx';
import PageFallback from './components/ui/PageFallback.jsx';

// Public
const Tournaments = lazy(() => import('./pages/public/Tournaments.jsx'));
const TournamentDetail = lazy(() => import('./pages/public/TournamentDetail.jsx'));
const Leaderboard = lazy(() => import('./pages/public/Leaderboard.jsx'));
const Matches = lazy(() => import('./pages/public/Matches.jsx'));
const MatchDetail = lazy(() => import('./pages/public/MatchDetail.jsx'));
const Teams = lazy(() => import('./pages/public/Teams.jsx'));
const TeamDetail = lazy(() => import('./pages/public/TeamDetail.jsx'));
const PlayerProfile = lazy(() => import('./pages/public/PlayerProfile.jsx'));
const InfoPage = lazy(() => import('./pages/public/InfoPage.jsx'));
const NotFound = lazy(() => import('./pages/public/NotFound.jsx'));
// Auth
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Signup = lazy(() => import('./pages/auth/Signup.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));
// Player
const Dashboard = lazy(() => import('./pages/player/Dashboard.jsx'));
const EditProfile = lazy(() => import('./pages/player/EditProfile.jsx'));
const MyTeams = lazy(() => import('./pages/player/MyTeams.jsx'));
const CreateTeam = lazy(() => import('./pages/player/CreateTeam.jsx'));
const JoinTeam = lazy(() => import('./pages/player/JoinTeam.jsx'));
const ManageTeam = lazy(() => import('./pages/player/ManageTeam.jsx'));
// Admin
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const AdminOverview = lazy(() => import('./pages/admin/Overview.jsx'));
const AdminTournaments = lazy(() => import('./pages/admin/Tournaments.jsx'));
const AdminRegistrations = lazy(() => import('./pages/admin/Registrations.jsx'));
const AdminTeams = lazy(() => import('./pages/admin/Teams.jsx'));
const AdminPlayers = lazy(() => import('./pages/admin/Players.jsx'));
const AdminMatches = lazy(() => import('./pages/admin/Matches.jsx'));
const AdminLeaderboard = lazy(() => import('./pages/admin/Leaderboard.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/Settings.jsx'));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 350);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="tournaments/:id" element={<TournamentDetail />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="matches" element={<Matches />} />
            <Route path="matches/:id" element={<MatchDetail />} />
            <Route path="teams" element={<Teams />} />
            <Route path="players/:username" element={<PlayerProfile />} />
            <Route path="about" element={<InfoPage page="about" />} />
            <Route path="contact" element={<InfoPage page="contact" />} />
            <Route path="privacy" element={<InfoPage page="privacy" />} />
            <Route path="terms" element={<InfoPage page="terms" />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="my-teams" element={<MyTeams />} />
              <Route path="teams/create" element={<CreateTeam />} />
              <Route path="teams/join" element={<JoinTeam />} />
              <Route path="teams/:id/manage" element={<ManageTeam />} />
            </Route>
            {/* After the static team routes so "create"/"join" are not read as ids */}
            <Route path="teams/:id" element={<TeamDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="tournaments" element={<AdminTournaments />} />
              <Route path="registrations" element={<AdminRegistrations />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="players" element={<AdminPlayers />} />
              <Route path="matches" element={<AdminMatches />} />
              <Route path="leaderboard" element={<AdminLeaderboard />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
