import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useGame } from "../context/GameContext";
import "./SeaSolve.css";

const API_BASE = "http://localhost:3000/kriyabe";
const KriyaID = "KRIYA2026";

export default function SeaSolve() {
  const location = useLocation();
  const navigate = useNavigate();
  const { kriyaID: routeKriyaID, seaId: routeSeaId } = useParams();

  const kriyaID = routeKriyaID || location.state?.kriyaID || KriyaID;
  const seaId = Number(routeSeaId);

  const { markSeaOpened } = useGame();

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestion() {
      try {
        if (!kriyaID) {
          throw new Error("Team ID missing.");
        }

        if (!Number.isFinite(seaId)) {
          throw new Error("Sea ID missing.");
        }

        const url = `${API_BASE}/api/round1/questions/${seaId}?team=${kriyaID}`;
        console.log("Fetching question from:", url);

        const res = await fetch(url);
        const text = await res.text();

        console.log("Status:", res.status);
        console.log("Text:", text);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const data = JSON.parse(text);

        if (!cancelled) {
          setQuestion(data);
        }
      } catch (err) {
        if (!cancelled) {
          setMsg(err.message || "Could not load question.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuestion();

    return () => {
      cancelled = true;
    };
  }, [kriyaID, seaId]);

  const submitAnswer = async () => {
    if (submitLockRef.current) return;

    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      setMsg("Enter answer");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/round1/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kriyaID,
          seaId,
          answer: trimmedAnswer,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = JSON.parse(text);

      if (data.correct) {
        const earned = Number(data.earnedPoints ?? 0);
        const card = data.card ?? null;

        markSeaOpened(seaId, earned);

        navigate("/anchorage", {
          replace: true,
          state: {
            ship: location.state?.ship,
            kriyaID,
            reward: { seaId, earned, card },
          },
        });
      } else {
        setMsg(data.msg || "Wrong answer!");
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
        <p className="team-id-label">Team: {kriyaID}</p>

        {loading && <p>Loading...</p>}

        {!loading && question && (
          <>
            <h3>{question.questionType}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{question.question}</p>

            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt={`Sea ${question.questionNo}`}
                className="question-image"
              />
            )}

            {Array.isArray(question.options) && question.options.length > 0 && (
              <div className="options-list">
                {question.options.map((opt, index) => (
                  <div key={index} className="option-item">
                    {opt}
                  </div>
                ))}
              </div>
            )}

            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer (A / B / C / D)"
              className="answer-input"
            />

            <button
              onClick={submitAnswer}
              disabled={submitting}
              className="submit-btn"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </>
        )}

        {msg && <p className="msg">{msg}</p>}
      </div>
    </div>
  );
}