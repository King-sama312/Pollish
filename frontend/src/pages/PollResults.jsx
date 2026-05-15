import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/intercept.js";
import useSocket from "../hooks/useSocket.js";
import { QRCodeSVG } from "qrcode.react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  if (loading) return <div className="page-container" style={{textAlign: "center"}}>Loading results...</div>;
  
  if (isUnpublished) {
    return (
      <div className="page-container">
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <h2>Results Not Available</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>The creator of this poll has not published the results yet.</p>
          <Link to="/">
            <button style={{ marginTop: "2rem" }}>Go to Homepage</button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) return <div className="page-container text-error" style={{textAlign: "center"}}>{error}</div>;
  if (!poll) return <div className="page-container text-error" style={{textAlign: "center"}}>Poll not found</div>;

  const chartData = {
    labels: options.map((o) => o.text),
    datasets: [
      {
        label: "Votes",
        data: options.map((o) => o.voteCount),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: "rgba(255, 255, 255, 0.7)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" }
      },
      x: {
        ticks: { color: "rgba(255, 255, 255, 0.7)" },
        grid: { display: false }
      }
    },
  };

  return (
    <div className="page-container">
      <div className="glass-panel">
        <h1>{poll.question}</h1>
        {poll.description && <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>{poll.description}</p>}

        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", alignItems: "center" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--primary-color)" }}>{totalVotes} Responses</span>
          <span className="badge">{poll.isAnonymous ? "Anonymous" : "Public"}</span>
          {poll.endsAt && (
            <span className="badge" style={{ background: "rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
              Ends: {new Date(poll.endsAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <table className="table-results">
          <thead>
            <tr>
              <th>Option</th>
              <th style={{ textAlign: "right" }}>Votes</th>
              <th style={{ textAlign: "right" }}>%</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.id}>
                <td style={{ fontWeight: "500" }}>{option.text}</td>
                <td style={{ textAlign: "right", color: "var(--primary-color)", fontWeight: "600" }}>
                  {option.voteCount}
                </td>
                <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                  {totalVotes > 0
                    ? ((option.voteCount / totalVotes) * 100).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-panel" style={{ marginTop: "2rem", textAlign: "center" }}>
        <h3>Share this poll</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Invite others to vote by sharing the link or QR code.</p>

        <div style={{ display: "inline-block", padding: "1rem", background: "#fff", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <QRCodeSVG value={voteUrl} size={150} level="M" />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", maxWidth: "500px", margin: "0 auto" }}>
          <input
            type="text"
            readOnly
            value={voteUrl}
            onClick={(e) => e.target.select()}
            style={{ flex: 1, fontFamily: "monospace" }}
          />
          <button onClick={copyLink}>
            {copied ? "Copied! ✓" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PollResults;