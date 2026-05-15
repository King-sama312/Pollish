import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/auth.context";
import api from "./utils/intercept.js";
import GetMe from "./pages/GetMe.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreatePoll from "./pages/CreatePoll.jsx";
import VotePoll from "./pages/VotePoll.jsx";
import PollResults from "./pages/PollResults.jsx";

function Navigation() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="nav-bar">
      <Link to="/" className="nav-brand">PollSphere</Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/polls/create">Create Poll</Link>
            <button 
              onClick={handleLogout} 
              className="secondary-btn" 
              style={{ marginLeft: "1rem", padding: "0.4rem 1rem", fontSize: "0.875rem" }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register"><button style={{padding: "0.4rem 1rem"}}>Sign Up</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/me" element={<GetMe />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/polls/create" element={<CreatePoll />} />
          <Route path="/polls/:pollId/vote" element={<VotePoll />} />
          <Route path="/polls/:pollId/results" element={<PollResults />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;