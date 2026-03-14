import "./Anchorage.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../config/api";

export default function Anchorage() {
  const navigate = useNavigate();
  const location = useLocation();

  const team = JSON.parse(localStorage.getItem("team"));
  const kriyaID = location.state?.kriyaID || team?.kriyaID;
  const selectedShip = location.state?.ship;
  const shipName = selectedShip?.name || "Pirate Voyage";

  const { chests, points, seasCleared, cards, addCard, markSeaOpened } = useGame();

  const headerRef = useRef(null);
  const chestRefs = useRef({});
  const processedRewardKeyRef = useRef(null);

  const [coinAnim, setCoinAnim] = useState(null);
  const [fly, setFly] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [pendingActionCard, setPendingActionCard] = useState(null);

  const [questions, setQuestions] = useState([]);
  const ROUND_SECONDS = 30 * 60;
  const TIMER_KEY = "pirate_round1_start_ts";

  // --- Persistent timer: store start timestamp in localStorage ---
  const [timeLeft, setTimeLeft] = useState(() => {
    const stored = localStorage.getItem(TIMER_KEY);
    if (stored) {
      const elapsed = Math.floor((Date.now() - Number(stored)) / 1000);
      return Math.max(ROUND_SECONDS - elapsed, 0);
    }
    // First visit — record start time
    localStorage.setItem(TIMER_KEY, String(Date.now()));
    return ROUND_SECONDS;
  });

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/round1/questions?kriyaID=${kriyaID}`);
      const data = await res.json();
      if (res.ok) setQuestions(data);
    } catch (err) { console.log("Error fetching questions", err); }
  };

  useEffect(() => { if (kriyaID) fetchQuestions(); }, [kriyaID]);

  const handleSolve = (chest) => {
    if (!chest || chest.opened) return;
    const question = questions.find(q => Number(q.questionNo) === chest.id);
    navigate(`/team/${kriyaID}/sea/${chest.id}`, { state: { ship: selectedShip, kriyaID, question } });
  };

  const formatTime = (sec) => { const m = Math.floor(sec / 60); const s = sec % 60; return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; };

  // Tick down every second; re-sync against the stored timestamp to avoid drift
  useEffect(() => {
    const id = setInterval(() => {
      const stored = localStorage.getItem(TIMER_KEY);
      if (!stored) return;
      const elapsed = Math.floor((Date.now() - Number(stored)) / 1000);
      setTimeLeft(Math.max(ROUND_SECONDS - elapsed, 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);


  const closeCardPopup = () => {
    if (pendingCard) {
      addCard(pendingCard);
      // Save to backend
      const token = localStorage.getItem("token");
      fetch(`${API_BASE}/api/teams/add-earned-algo-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ cardName: pendingCard.name })
      }).catch(err => console.error("Failed to save earned card", err));
      setPendingCard(null);
      // If there's an action card waiting, keep showCard true but pendingCard is now null
      if (!pendingActionCard) {
        setShowCard(false);
      }
    } else if (pendingActionCard) {
      setPendingActionCard(null);
      setShowCard(false);
    } else {
      setShowCard(false);
    }
  };

  // ⭐ Process reward
  useEffect(() => {
    const reward = location.state?.reward;
    if (!reward || !reward.seaId || (reward.earned ?? 0) <= 0) return;

    const seaId = Number(reward.seaId);
    const earned = Number(reward.earned ?? 0);
    const card = reward.card ?? null;
    const rewardKey = `${seaId}:${earned}:${card?._id ?? "no-card"}`;

    if (processedRewardKeyRef.current === rewardKey) return;
    processedRewardKeyRef.current = rewardKey;

    // Update points immediately
    markSeaOpened(seaId, earned, card);

    // Show card
    const actionCard = reward.actionCard ?? null;
    if (card) {
      setPendingCard({ id: card._id ?? card.name, name: card.name, description: card.description });
      setShowCard(true);
    }
    
    if (actionCard) {
      setPendingActionCard({ 
        id: actionCard._id ?? actionCard.name, 
        name: actionCard.name, 
        description: actionCard.description,
        isAction: true 
      });
      setShowCard(true);
    }

    // Coin animation
    requestAnimationFrame(() => {
      const chestEl = chestRefs.current[seaId];
      const headerEl = headerRef.current;
      if (!chestEl || !headerEl) return;
      const chestRect = chestEl.getBoundingClientRect();
      const headerRect = headerEl.getBoundingClientRect();
      const startX = chestRect.left + chestRect.width / 2;
      const startY = chestRect.top + chestRect.height / 2;
      const endX = headerRect.left + headerRect.width / 2;
      const endY = headerRect.top + headerRect.height / 2;
      setCoinAnim({ x: startX, y: startY, dx: endX - startX, dy: endY - startY, earned });
      requestAnimationFrame(() => setFly(true));
      setTimeout(() => { setFly(false); setCoinAnim(null); }, 3000);
    });

    // Clear reward from location state to prevent reuse
    window.history.replaceState({}, document.title);
  }, [location.key]);

  const goToRound2 = () => {
    if (!window.confirm("⚠️ Enter Round 2 now?\nYou cannot return back to Round 1.")) return;
    navigate("/map", { replace: true, state: { ship: selectedShip, kriyaID } });
  };

  return (
    <div className="map-container">
      <div className="ship-header">
        <div className="title-wrap">
          <h2 className="ship-title"> {shipName}</h2>
          {selectedShip && (
            <div className="ship-overlay-badge">
              <img src={selectedShip.img} alt={selectedShip.name} />
              <div className="ship-overlay-text">
                <div className="ship-overlay-name">{selectedShip.name}</div>
                {selectedShip.subtitle && <div className="ship-overlay-sub">{selectedShip.subtitle}</div>}
              </div>
            </div>
          )}
        </div>
        <div className="ship-round">Round 1</div>
        <div className="progress" ref={headerRef}>🕒 {formatTime(timeLeft)} | 🪙 {points} | {seasCleared} / 7</div>
      </div>

      <div className="chests-layer">
        {chests.map(chest => (
          <div key={chest.id} className={`chest-wrapper ${chest.opened ? "opened" : ""}`} ref={el => chestRefs.current[chest.id] = el}
            style={{ left: `${chest.left}%`, top: `${chest.top}%`, cursor: chest.opened ? "default" : "pointer" }}
            onClick={() => handleSolve(chest)}>
            <img src={chest.opened ? "/codequest/opens.png" : "/codequest/locked.png"} alt="chest" className="chest" />
            <div className="chest-name">{chest.name}</div>
          </div>
        ))}
      </div>

      {showCard && (pendingCard || pendingActionCard) && (
        <div className="card-overlay" onClick={closeCardPopup}>
          <div className={`algo-modal ${!pendingCard && pendingActionCard ? "action-card-modal" : ""}`} onClick={e => e.stopPropagation()}>
            <div className="card-type-badge">{!pendingCard && pendingActionCard ? "ACTION CARD" : "ALGORITHM CARD"}</div>
            <h2 className="algo-name">{(pendingCard || pendingActionCard).name}</h2>
            <p className="algo-desc">{(pendingCard || pendingActionCard).description}</p>
            <button className="close-card-btn" onClick={closeCardPopup}>
              {pendingCard && pendingActionCard ? "Next Card →" : "Close"}
            </button>
          </div>
        </div>
      )}

      <div className="cards-bar">
        <div className="cards-bar-title">
          Collected Algorithm Cards ({cards.length})
          <button className="round2-btn" onClick={goToRound2}>Round 2 →</button>
        </div>
        <div className="cards-list">
          {cards.length === 0 && <div className="cards-empty">Solve seas to unlock cards…</div>}
          {cards.map(c => {
            const key = String(c.id ?? c.name);
            return <div key={key} className="card-chip">
              <span className="chip-icon">{c.icon || "📜"}</span>
              <span className="chip-name">{c.name}</span>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}