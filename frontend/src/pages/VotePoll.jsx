import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/intercept.js";
import { useAuth } from "../context/auth.context";

function VotePoll() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [poll, setPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voteError, setVoteError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Selection state
  const [selected, setSelected] = useState(null);

  // Captcha state (for anonymous voters)
  const [captchaId, setCaptchaId] = useState(null);
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaText, setCaptchaText] = useState("");

  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    api
      .get(`/polls/get/${pollId}`)
      .then((res) => {
        const data = res.data.data;
        setPoll(data.poll);
        setOptions(data.options);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load poll");
      })
      .finally(() => setLoading(false));
  }, [pollId]);

  useEffect(() => {
    if (!user && poll?.isAnonymous && !voteSuccess) {
      fetchCaptcha();
    }
  }, [user, poll, voteSuccess]);

  const fetchCaptcha = async () => {
    try {
      const res = await api.get("/polls/captcha/generate"); 
      setCaptchaId(res.data.data.captchaId);
      setCaptchaSvg(res.data.data.svg);
      setCaptchaText("");
    } catch (err) {
      console.error("Failed to fetch captcha:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVoteError("");

    if (!selected) {
      setVoteError("Please select an option");
      return;
    }

    const payload = {
      optionIds: [selected],
    };

    if (!user && captchaId) {
      payload.captchaId = captchaId;
      payload.captchaText = captchaText;
    }

    try {
      setSubmitting(true);
      await api.post(`/polls/${pollId}/vote`, payload);
      setVoteSuccess(true);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to cast vote";
      setVoteError(message);
      if (!user && poll?.isAnonymous) fetchCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{textAlign: "center", padding: "4rem"}}>Loading poll...</div>;
  if (error) return <div className="text-error" style={{textAlign: "center", padding: "4rem"}}>{error}</div>;
  if (!poll) return <div className="text-error" style={{textAlign: "center", padding: "4rem"}}>Poll not found</div>;

  if (voteSuccess) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 0" }}>
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "white", borderRadius: "16px", border: "1px solid var(--surface-border)" }}>
          <div style={{ width: "80px", height: "80px", background: "black", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem auto", fontSize: "2.5rem" }}>
            ✓
          </div>
          <h2 style={{ marginBottom: "1rem", fontSize: "2rem" }}>Vote Submitted!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.1rem" }}>
            Your response has been recorded securely. Thank you for participating!
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button className="secondary-btn" onClick={() => navigate("/")} style={{ padding: "0.75rem 2rem" }}>
              Return Home
            </button>
            <button onClick={() => navigate(`/polls/${pollId}/results`)} style={{ padding: "0.75rem 2rem" }}>
              View Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 0" }}>
      <div style={{ background: "white", borderRadius: "16px", border: "1px solid var(--surface-border)", padding: "3rem 2rem" }}>
        <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
          <div style={{ display: "inline-block", padding: "0.25rem 0.75rem", background: "#f3f4f6", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" }}>
            {poll.isAnonymous ? "Anonymous Poll" : "Authenticated Poll"}
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem", lineHeight: 1.3 }}>{poll.question}</h1>
          {poll.description && <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>{poll.description}</p>}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ margin: "2.5rem 0" }}>
            {options.map((option) => (
              <label
                key={option.id}
                className={`option-label ${selected === option.id ? 'selected' : ''}`}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  padding: "1.25rem", 
                  borderRadius: "12px",
                  border: selected === option.id ? "2px solid black" : "1px solid var(--surface-border)",
                  background: selected === option.id ? "#fafafa" : "white",
                  marginBottom: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ 
                  width: "24px", 
                  height: "24px", 
                  borderRadius: "50%", 
                  border: selected === option.id ? "6px solid black" : "2px solid #d1d5db",
                  marginRight: "1rem",
                  transition: "all 0.2s ease"
                }}></div>
                <span style={{ fontSize: "1.1rem", fontWeight: selected === option.id ? 600 : 400 }}>{option.text}</span>
              </label>
            ))}
          </div>

          {/* Captcha for anonymous voters */}
          {!user && captchaSvg && (
            <div style={{ background: "#f9fafb", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", border: "1px solid var(--surface-border)" }}>
              <p style={{ margin: "0 0 1rem 0", fontWeight: "600" }}>Verify you're human</p>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
                <div
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                  style={{ background: "#fff", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--surface-border)" }}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={fetchCaptcha}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                >
                  ↻ Refresh
                </button>
              </div>
              <input
                type="text"
                value={captchaText}
                onChange={(e) => setCaptchaText(e.target.value)}
                placeholder="Enter the text above"
                required
                style={{ background: "white" }}
              />
            </div>
          )}

          {voteError && <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#fef2f2", color: "#ef4444", borderRadius: "8px", border: "1px solid #fca5a5" }}>{voteError}</div>}

          <button 
            type="submit" 
            disabled={submitting}
            style={{ width: "100%", padding: "1.25rem", fontSize: "1.1rem", fontWeight: 600 }}
          >
            {submitting ? "Submitting..." : "Submit Vote"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VotePoll;