import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/auth.context";

import PublicLayout from "./layouts/PublicLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreatePoll from "./pages/CreatePoll.jsx";
import VotePoll from "./pages/VotePoll.jsx";
import PollResults from "./pages/PollResults.jsx";

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>Loading...</div>;

  return (
    <Routes>
      {/* Public Routes with Navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        
        {/* Voting view is public, so it uses the PublicLayout (with Navbar) */}
        <Route path="/polls/:pollId/vote" element={<VotePoll />} />
      </Route>

      {/* Authenticated Routes with Sidebar */}
      <Route element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/polls/create" element={<CreatePoll />} />
        {/* Poll Results are viewed inside the Dashboard by the creator */}
        <Route path="/polls/:pollId/results" element={<PollResults />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;