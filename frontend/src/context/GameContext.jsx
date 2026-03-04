// src/context/GameContext.jsx
import { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";

const GameContext = createContext(null);

const seaNames = [
  "Black Sea (Ammand the Corsair)",
  "Caspian Sea (Hector Barbossa)",
  "Mediterranean Sea (Chevalle)",
  "Pacific Ocean (Mistress Ching)",
  "Atlantic Ocean (Gentleman Jocard)",
  "Caribbean Sea (Jack Sparrow)",
  "Indian Ocean (Sri Sumbhajee Angria)",
];

const slots = [
  { left: 12, top: 55 },
  { left: 28, top: 38 },
  { left: 50, top: 18 },
  { left: 70, top: 26 },
  { left: 86, top: 30 },
  { left: 83, top: 68 },
  { left: 58, top: 58 },
];

const STORAGE_KEY = "pirate_game_v1";

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function GameProvider({ children }) {
  const saved = loadSaved();

  const [points, setPoints] = useState(() => Number(saved?.points ?? 0));
  const [opened, setOpened] = useState(() => {
    const arr = Array.isArray(saved?.opened) ? saved.opened : [];
    return new Set(arr.map((x) => Number(x)).filter((n) => Number.isFinite(n)));
    });
  const [cards, setCards] = useState(() => (Array.isArray(saved?.cards) ? saved.cards : []));

  // ✅ keep a ref so we can check opened instantly (no setState updater side-effects)
  const openedRef = useRef(opened);
  useEffect(() => {
    openedRef.current = opened;
  }, [opened]);

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        points,
        opened: Array.from(opened),
        cards,
      })
    );
  }, [points, opened, cards]);

  const chests = useMemo(() => {
    return seaNames.map((name, index) => {
      const id = index + 1;
      return {
        id,
        name,
        left: slots[index].left,
        top: slots[index].top,
        opened: opened.has(id),
      };
    });
  }, [opened]);

  const seasCleared = opened.size;

  // ✅ Add card ONLY when Anchorage popup is closed
  const addCard = (card) => {
    if (!card) return;
    const key = String(card.id ?? card.name ?? "").trim();
    if (!key) return;

    setCards((prev) => {
      const exists = prev.some((c) => String(c.id ?? c.name) === key);
      return exists ? prev : [...prev, { ...card, id: key }];
    });
  };

  // ✅ FIXED: no setPoints inside setOpened updater (prevents 50->100 in StrictMode)
  const markSeaOpened = (seaId, earnedPoints = 0) => {
    const sid = Number(seaId);
    const pts = Number(earnedPoints);

    if (!Number.isFinite(sid)) return;
    if (sid < 1 || sid > seaNames.length) return;

    // ✅ guard: if already opened, do nothing
    if (openedRef.current.has(sid)) return;

    // update opened
    setOpened((prev) => {
      if (prev.has(sid)) return prev;
      const next = new Set(prev);
      next.add(sid);
      return next;
    });

    // update points once
    if (Number.isFinite(pts) && pts !== 0) {
      setPoints((p) => p + pts);
    }
  };

  const resetGame = () => {
    setPoints(0);
    setOpened(new Set());
    setCards([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    chests,
    points,
    seasCleared,
    cards,
    addCard,
    markSeaOpened,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}