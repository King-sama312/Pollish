import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/intercept.js";
import useSocket from "../hooks/useSocket.js";
import { QRCodeSVG } from "qrcode.react";

function PollResults() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUnpublished, setIsUnpublished] = useState(false);
  const [copied, setCopied] = useState(false);

  const socket = useSocket();
  const voteUrl = `${window.location.origin}/polls/${pollId}/vote`;

  useEffect(() => {
    api
      .get(`/polls/get/${pollId}?results=true`)
      .then((res) => {
        const data = res.data.data;
        setPoll(data.poll);
        setOptions(data.options);
        setTotalVotes(data.totalVotes);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setIsUnpublished(true);
        } else {
          setError(err.response?.data?.message || "Failed to load poll results");
        }
      })
      .finally(() => setLoading(false));
  }, [pollId]);

  useEffect(() => {
    if (!socket || isUnpublished || !poll) return;

    socket.emit("join:poll", pollId);

    const handleVote = (data) => {
      if (data.pollId !== pollId) return;

      setOptions((prev) => {
        if (data.optionIds && data.optionIds.length > 0) {
          return prev.map((opt) =>
            data.optionIds.includes(opt.id)
              ? { ...opt, voteCount: opt.voteCount + 1 }
              : opt
          );
        }
        if (data.optionId) {
          return prev.map((opt) =>
            opt.id === data.optionId
              ? { ...opt, voteCount: opt.voteCount + 1 }
              : opt
          );
        }
        return prev;
      });

      if (data.totalVotes !== undefined) {
        setTotalVotes(data.totalVotes);
      }
    };

    socket.on("poll:vote", handleVote);

    return () => {
      socket.emit("leave:poll", pollId);
      socket.off("poll:vote", handleVote);
    };
  }, [socket, pollId, isUnpublished, poll]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(voteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = voteUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div style={{textAlign: "center", padding: "4rem"}}>Loading results...</div>;
  
  if (isUnpublished) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 0" }}>
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "white", borderRadius: "16px", border: "1px solid var(--surface-border)" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Results Not Available</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.1rem" }}>The creator of this poll has not published the results yet.</p>
          <Link to="/">
            <button style={{ padding: "0.75rem 2rem" }}>Go to Homepage</button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) return <div className="text-error" style={{textAlign: "center", padding: "4rem"}}>{error}</div>;
  if (!poll) return <div className="text-error" style={{textAlign: "center", padding: "4rem"}}>Poll not found</div>;

  const createdDate = new Date(poll.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endsAtDate = poll.endsAt ? new Date(poll.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const isEnded = poll.endsAt && new Date(poll.endsAt) < new Date();

  return (
    <div style={{ maxWidth: "800px", margin: "0", padding: "1rem 0" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link to="/dashboard" style={{ color: "var(--text-secondary)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <span>←</span> Back to Polls
        </Link>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{poll.question}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {totalVotes} votes • Created {createdDate} {endsAtDate ? `• Ends ${endsAtDate}` : ''}
            </p>
          </div>
          <button className="secondary-btn" onClick={copyLink} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
            Share
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2rem", borderBottom: "1px solid var(--surface-border)", marginBottom: "3rem" }}>
        <div style={{ paddingBottom: "1rem", borderBottom: "2px solid black", fontWeight: 600 }}>Overview</div>
        <div style={{ paddingBottom: "1rem", color: "var(--text-secondary)", cursor: "not-allowed" }}>Voters</div>
      </div>

      {/* Custom Horizontal Bar Charts */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "4rem" }}>
        {options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          return (
            <div key={option.id} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: "120px", fontWeight: 500, fontSize: "0.95rem" }}>{option.text}</div>
              <div style={{ flex: 1, height: "24px", background: "#f3f4f6", borderRadius: "12px", overflow: "hidden", margin: "0 1.5rem" }}>
                <div style={{ height: "100%", width: `${percentage}%`, background: "black", borderRadius: "12px", transition: "width 0.5s ease" }}></div>
              </div>
              <div style={{ width: "80px", textAlign: "right", color: "var(--text-secondary)", fontSize: "0.875rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <span style={{ fontWeight: 600, color: "black" }}>{percentage}%</span> 
                <span>({option.voteCount})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "4rem" }}>
        <div style={{ flex: 1, minWidth: "150px", border: "1px solid var(--surface-border)", borderRadius: "12px", padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", background: "white" }}>
          <div style={{ fontSize: "1.5rem" }}>🗳️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{totalVotes}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Total Votes</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: "150px", border: "1px solid var(--surface-border)", borderRadius: "12px", padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", background: "white" }}>
          <div style={{ fontSize: "1.5rem" }}>📋</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{options.length}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Options</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: "150px", border: "1px solid var(--surface-border)", borderRadius: "12px", padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", background: "white" }}>
          <div style={{ fontSize: "1.5rem" }}>⏳</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {isEnded ? "Ended" : poll.endsAt ? "Active" : "Ongoing"}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Status</div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default PollResults;