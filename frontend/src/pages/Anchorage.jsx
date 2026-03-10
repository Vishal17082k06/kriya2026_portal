import "./Anchorage.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "../context/GameContext";
import { useEffect, useRef, useState } from "react";

const KriyaID = "KRIYA2026";

export default function Anchorage() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedShip = location.state?.ship;
  const shipName = selectedShip?.name || "Pirate Voyage";
  const kriyaID = location.state?.kriyaID || KriyaID;

  const { chests, points, seasCleared, cards, addCard } = useGame();

  const headerRef = useRef(null);
  const chestRefs = useRef({});
  const processedRewardKeyRef = useRef(null);

  const [coinAnim, setCoinAnim] = useState(null);
  const [fly, setFly] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);

  const ROUND_SECONDS = 30 * 60;
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);

  const handleSolve = (chest) => {
    if (!chest || chest.opened) return;

    if (!kriyaID) {
      alert("Team ID missing. Please login again.");
      return;
    }

    navigate(`/team/${kriyaID}/sea/${chest.id}`, {
      state: {
        ship: selectedShip,
        kriyaID,
      },
    });
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const saveRewardToDB = async ({ seaId, earned, card }) => {
    try {
      await fetch("http://localhost:3000/api/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kriyaID,
          seaId,
          pointsEarned: earned ?? 0,
          cardId: card?._id ?? null,
          shipId: selectedShip?.id ?? null,
        }),
      });
    } catch (e) {
      console.error("Failed to save reward:", e);
    }
  };

  const closeCardPopup = () => {
    if (pendingCard) addCard(pendingCard);
    setShowCard(false);
    setPendingCard(null);
  };

  useEffect(() => {
    const reward = location.state?.reward;
    if (!reward || !reward.seaId) return;

    const seaId = Number(reward.seaId);
    const earned = Number(reward.earned ?? 0);
    const card = reward.card ?? null;

    const rewardKey = `${seaId}:${earned}:${card?._id ?? card?.name ?? "no-card"}`;
    if (processedRewardKeyRef.current === rewardKey) return;
    processedRewardKeyRef.current = rewardKey;

    saveRewardToDB({ seaId, earned, card });

    if (card) {
      setPendingCard({
        id: card._id ?? card.name,
        name: card.name,
        description: card.description,
        difficulty: card.difficultyTag,
      });
      setShowCard(true);
    }

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

      setCoinAnim({
        x: startX,
        y: startY,
        dx: endX - startX,
        dy: endY - startY,
        earned,
      });

      requestAnimationFrame(() => setFly(true));

      const t = setTimeout(() => {
        setFly(false);
        setCoinAnim(null);
      }, 3200);

      return () => clearTimeout(t);
    });
  }, [location.key]);

  const goToRound2 = () => {
    const ok = window.confirm("⚠️ Enter Round 2 now?\nYou cannot return back to Round 1.");
    if (!ok) return;

    navigate("/map", {
      replace: true,
      state: {
        ship: selectedShip,
        kriyaID,
      },
    });
  };

  return (
    <div className="map-container">
      <div className="ship-header">
        <div className="title-wrap">
          <h2 className="ship-title">⚓ {shipName}</h2>

          {selectedShip && (
            <div className="ship-overlay-badge">
              <img src={selectedShip.img} alt={selectedShip.name} />
              <div className="ship-overlay-text">
                <div className="ship-overlay-name">{selectedShip.name}</div>
                {selectedShip.subtitle && (
                  <div className="ship-overlay-sub">{selectedShip.subtitle}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ship-round">Round 1</div>

        <div className="progress" ref={headerRef}>
          🕒 {formatTime(timeLeft)} &nbsp;|&nbsp; 🪙 {points} &nbsp;|&nbsp; {seasCleared} / 7
        </div>
      </div>

      {chests.map((chest) => (
        <div
          key={chest.id}
          className={`chest-wrapper ${chest.opened ? "opened" : ""}`}
          ref={(el) => (chestRefs.current[chest.id] = el)}
          style={{
            left: `${chest.left}%`,
            top: `${chest.top}%`,
            cursor: chest.opened ? "default" : "pointer",
            opacity: chest.opened ? 0.9 : 1,
          }}
          onClick={() => handleSolve(chest)}
          title={chest.opened ? "Already solved" : "Click to solve"}
        >
          <img
            src={chest.opened ? "/opens.png" : "/locked.png"}
            alt="chest"
            className="chest"
          />
          <div className="chest-name">{chest.name}</div>
        </div>
      ))}

      {coinAnim &&
        Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`coin-fly ${fly ? "fly" : ""}`}
            style={{
              left: coinAnim.x,
              top: coinAnim.y,
              "--dx": `${coinAnim.dx}px`,
              "--dy": `${coinAnim.dy}px`,
              "--delay": `${i * 60}ms`,
              "--spreadX": `${(Math.random() * 80 - 40).toFixed(0)}px`,
              "--spreadY": `${(Math.random() * 60 - 30).toFixed(0)}px`,
            }}
          >
            🪙
          </div>
        ))}

      {showCard && pendingCard && (
        <div className="card-overlay" onClick={closeCardPopup}>
          <div className="algo-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="algo-name">{pendingCard.name}</h2>
            <div className="algo-tag">{pendingCard.difficulty}</div>
            <p className="algo-desc">{pendingCard.description}</p>

            <button className="close-card-btn" onClick={closeCardPopup}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="cards-bar">
        <div className="cards-bar-title">
          Collected Algorithm Cards ({cards.length})
          <button className="round2-btn" onClick={goToRound2}>
            Round 2 →
          </button>
        </div>

        <div className="cards-list">
          {cards.length === 0 && (
            <div className="cards-empty">Solve seas to unlock cards…</div>
          )}

          {cards.map((c) => {
            const key = String(c.id ?? c.name);
            return (
              <div key={key} className="card-chip" title={c.description || ""}>
                <span className="chip-icon">{c.icon || "📜"}</span>
                <span className="chip-name">{c.name}</span>
                <span className="chip-tag">{c.difficulty || "?"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}