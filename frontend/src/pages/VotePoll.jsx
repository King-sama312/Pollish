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

  if (loading) return <div className="page-container" style={{textAlign: "center"}}>Loading poll...</div>;
  if (error) return <div className="page-container text-error" style={{textAlign: "center"}}>{error}</div>;
  if (!poll) return <div className="page-container text-error" style={{textAlign: "center"}}>Poll not found</div>;

  if (voteSuccess) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ width: "80px", height: "80px", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem auto", fontSize: "2.5rem" }}>
            ✓
          </div>
          <h2 style={{ marginBottom: "1rem" }}>Vote Submitted Successfully!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2.5rem" }}>
            Your response has been recorded securely. Thank you for participating!
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button className="secondary-btn" onClick={() => navigate("/")}>
              Return Home
            </button>
            <button onClick={() => navigate(`/polls/${pollId}/results`)}>
              View Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="glass-panel">
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>{poll.question}</h1>
          {poll.description && <p style={{ color: "var(--text-secondary)" }}>{poll.description}</p>}
          <div style={{ marginTop: "1rem" }}>
            <span className="badge">{poll.isAnonymous ? "Anonymous" : "Authenticated"}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ margin: "2rem 0" }}>
            {options.map((option) => (
              <label
                key={option.id}
                className={`option-label ${selected === option.id ? 'selected' : ''}`}
                style={{ display: "flex", alignItems: "center" }}
              >
                <input
                  type="radio"
                  name="voteOption"
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                  style={{ marginRight: "1rem", accentColor: "var(--primary-color)", width: "1.2rem", height: "1.2rem" }}
                />
                <span style={{ fontSize: "1.1rem" }}>{option.text}</span>
              </label>
            ))}
          </div>

          {/* Captcha for anonymous voters */}
          {!user && captchaSvg && (
            <div className="input-group" style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "8px" }}>
              <p style={{ margin: "0 0 1rem 0", fontWeight: "600" }}>Verify you're human</p>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <div
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                  style={{ background: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={fetchCaptcha}
                >
                  ↻ Refresh
                </button>
              </div>
              <input
                type="text"
                value={captchaText}
                onChange={(e) => setCaptchaText(e.target.value)}
                placeholder="Enter the text above"
                style={{ marginTop: "1rem" }}
                required
              />
            </div>
          )}

          {voteError && <div className="text-error" style={{ marginBottom: "1rem", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>{voteError}</div>}

          <button 
            type="submit" 
            disabled={submitting}
            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
          >
            {submitting ? "Submitting..." : "Submit Vote ✓"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VotePoll;