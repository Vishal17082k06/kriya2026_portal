// src/pages/SeaSolve.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useGame } from "../context/GameContext";
import "./SeaSolve.css";

const API_BASE = "http://localhost:3002";

export default function SeaSolve() {
  const { id } = useParams();
  const seaId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { markSeaOpened } = useGame();

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (!Number.isFinite(seaId)) {
      setMsg("Invalid sea id. Go back and click a chest again.");
      setLoading(false);
      return;
    }

    async function loadQuestion() {
      try {
        const url = `${API_BASE}/round1/questions/${seaId}`;
        const res = await fetch(url);

        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

        const data = JSON.parse(text);
        if (!cancelled) setQuestion(data);
      } catch (err) {
        if (!cancelled) setMsg(err.message || "Could not load question.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQuestion();
    return () => (cancelled = true);
  }, [seaId]);

  const submitAnswer = async () => {
    if (submitLockRef.current) return;
    if (!answer.trim()) {
      setMsg("Enter answer");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/round1/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seaId, answer: answer.trim() }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

      const data = JSON.parse(text);

      if (data.correct) {
        const earned = Number(data.earnedPoints ?? 0);
        const card = data.card ?? null;

        
        markSeaOpened(seaId, earned);

        navigate("/anchorage", {
          replace: true,
          state: {
            ship: location.state?.ship,
            reward: { seaId, earned, card },
          },
        });
      } else {
        setMsg("Wrong answer!");
      }
    } catch (err) {
      setMsg(err.message || "Network error");
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <div className="solve-container">
      <div className="solve-card">
        <h2>🌊 Sea {Number.isFinite(seaId) ? seaId : "-"}</h2>

        {loading && <p>Loading...</p>}

        {!loading && question && (
          <>
            <h3>{question.title}</h3>
            <p>{question.prompt}</p>

            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer"
              className="answer-input"
            />

            <button onClick={submitAnswer} disabled={submitting} className="submit-btn">
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </>
        )}

        {msg && <p className="msg">{msg}</p>}
      </div>
    </div>
  );
}