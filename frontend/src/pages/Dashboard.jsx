import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/intercept.js";
import { useAuth } from "../context/auth.context";

function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) return;
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.data);
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        navigate("/login");
      });
  }, [user, setUser, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchPolls();
  }, [user]);

  const fetchPolls = () => {
    api
      .get("/polls/my-polls")
      .then((res) => {
        setPolls(res.data.data.polls || []);
      })
      .catch((err) => {
        console.error("Failed to fetch polls:", err);
        setError(err.response?.data?.message || "Failed to load polls");
      })
      .finally(() => setLoading(false));
  };

  const publishPoll = async (pollId, isPublished) => {
    try {
      await api.patch(`/polls/${pollId}/publish`, { isPublished });
      fetchPolls(); // Refresh list to get updated status
    } catch (err) {
      alert("Failed to update publish status");
    }
  };

  if (!user) return <div className="page-container" style={{textAlign: "center"}}>Loading...</div>;
  if (loading) return <div className="page-container" style={{textAlign: "center"}}>Loading polls...</div>;
  if (error) return <div className="page-container text-error" style={{textAlign: "center"}}>{error}</div>;

  if (polls.length === 0) {
    return (
      <div className="page-container">
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "0.5rem" }}>Welcome back, {user.name}!</p>
          <h1>My Dashboard</h1>
        </div>
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>You haven't created any polls yet</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Start collecting feedback today by creating your first poll.</p>
          <button onClick={() => navigate("/polls/create")}>
            Create a Poll
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ color: "var(--primary-color)", fontWeight: "600", marginBottom: "0.5rem" }}>Welcome back, {user.name}!</p>
        <div className="flex-between">
          <h1 style={{ margin: 0 }}>My Dashboard</h1>
          <button onClick={() => navigate("/polls/create")}>
            + Create Poll
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {polls.map((poll) => {
          const hasEnded = poll.endsAt && new Date(poll.endsAt) < new Date();
          return (
            <div key={poll.id} className="poll-card">
              <Link to={`/polls/${poll.id}/results`} style={{ textDecoration: "none", color: "inherit" }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>{poll.question}</h3>
              </Link>
              {poll.description && (
                <p style={{ margin: "0 0 1rem 0", color: "var(--text-secondary)", fontSize: "0.9rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {poll.description}
                </p>
              )}
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <span className="badge">{poll.isAnonymous ? "Anonymous" : "Public"}</span>
                {poll.isPublished ? (
                  <span className="badge published">Published</span>
                ) : (
                  <span className="badge" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5" }}>Draft</span>
                )}
                {hasEnded && <span className="badge" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fcd34d" }}>Ended</span>}
              </div>

              <div className="flex-between" style={{ borderTop: "1px solid var(--surface-border)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Responses</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--primary-color)" }}>{poll.totalVotes}</span>
                </div>
                
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="secondary-btn" onClick={() => navigate(`/polls/${poll.id}/results`)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}>
                    Results
                  </button>
                  {hasEnded && !poll.isPublished && (
                    <button onClick={() => publishPoll(poll.id, true)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem", background: "var(--success-color)" }}>
                      Publish
                    </button>
                  )}
                  {poll.isPublished && (
                    <button className="secondary-btn" onClick={() => publishPoll(poll.id, false)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}>
                      Unpublish
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;