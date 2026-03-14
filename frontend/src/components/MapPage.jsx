import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import mapImg from "../assets/roundbg.png";
import island1 from "../assets/island1.png";
import island2 from "../assets/island2.png";
import island3 from "../assets/island3.png";
import obj1 from "../assets/obj1.png";
import obj2 from "../assets/obj2.png";
import obj3 from "../assets/obj3.png";
import obj4 from "../assets/obj4.png";
import shovelImg from "../assets/shovel.png";
import { API_BASE } from "../config/api";
import { useGame } from "../context/GameContext";
import "../styles/mapPage.css";

const MapPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSolvedCount, setLastSolvedCount] = useState(() => {
    const saved = localStorage.getItem('kriya_solved_count');
    return saved ? parseInt(saved) : 0;
  });
  const [team, setTeam] = useState(() => {
    const saved = localStorage.getItem("team");
    return saved ? JSON.parse(saved) : null;
  });
  const [isTeamFetched, setIsTeamFetched] = useState(false);
  const [allAlgoCards, setAllAlgoCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState(() => {
    const saved = localStorage.getItem('kriya_selected_cards');
    return saved ? JSON.parse(saved) : [];
  });
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isActionPopupOpen, setIsActionPopupOpen] = useState(false);
  const [cardsChosen, setCardsChosen] = useState(() => {
    const saved = localStorage.getItem('kriya_cards_chosen');
    return saved === 'true';
  });

  // Treasure Hunt State
  const [isTreasureHunting, setIsTreasureHunting] = useState(false);
  const [foundObjects, setFoundObjects] = useState(() => {
    const saved = localStorage.getItem('kriya_found_objects');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTargetIndex, setCurrentTargetIndex] = useState(() => {
    const saved = localStorage.getItem('kriya_target_index');
    return saved ? parseInt(saved) : 0;
  });
  const [compassRotation, setCompassRotation] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagInput, setFlagInput] = useState("");
  const [unlockedActionCards, setUnlockedActionCards] = useState([]);

  const CHALLENGES = {
    d1: {
      title: "Mysterious Island Portal",
      url: "https://codequest-kriya-26-minigamectf.vercel.app/",
      flag: "FLAG{Pl4tf0rm1ng_P1r4t3_K1ng}",
      rewardId: 105,
      rewardName: "Ghost Ship"
    },
    d2: {
      title: "Ancient Navigator's Vault",
      url: "/codequest/puzzles/pirate_puzzle.html",
      flag: "FLAG{R1ng_Puzzl3_Mast3r_2026}",
      rewardId: 106,
      rewardName: "Kraken's Call"
    },
    d3: {
      title: "Blackbeard's Hidden Dispatch",
      url: "/codequest/puzzles/blackbeards_cipher.html",
      flag: "FLAG{C1ph3r_M4st3r_B1ackb3ard}",
      rewardId: 107,
      rewardName: "Blackbeard's Favor"
    },
    d4: {
      title: "The Navigator's Sunstone",
      url: "/codequest/puzzles/sunstone_puzzle.html",
      flag: "FLAG{B3am_B3nd3r_L3g3nd}",
      rewardId: 108,
      rewardName: "Navigator's Star"
    }
  };

  const [activeChallenge, setActiveChallenge] = useState(null);
  const [r2Questions, setR2Questions] = useState(() => {
    const saved = localStorage.getItem('kriya_r2_questions');
    return saved ? JSON.parse(saved) : [];
  });
  const [isR2SolveOpen, setIsR2SolveOpen] = useState(false);
  const [allR2Questions, setAllR2Questions] = useState([]);

  // Fetch all questions once to assist in filtering available cards
  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/round2/questions`);
        const data = await res.json();
        if (res.ok) setAllR2Questions(data);
      } catch (err) {
        console.error("Failed to fetch all R2 questions", err);
      }
    };
    fetchAll();
  }, []);

  // Save questions when they change
  React.useEffect(() => {
    if (r2Questions.length > 0) {
      localStorage.setItem('kriya_r2_questions', JSON.stringify(r2Questions));
    }
  }, [r2Questions]);
  const [currentR2Index, setCurrentR2Index] = useState(0);

  const { cards: gameCards } = useGame();

  // Filter available cards based on those won in Round 1 and NOT yet solved
  const availableCards = React.useMemo(() => {
    if (!team || !allAlgoCards.length) return [];

    // Get unique names of scrolls won in Round 1
    const wonScrollNames = team.round1?.selectedScrolls?.map(s => (s.name || '').toLowerCase().replace(/\s+/g, '')) || [];

    // Find IDs of already solved problems in Round 2
    const solvedProblemIds = team.round2?.problemsStatus
      ?.filter(ps => ps.status === "SOLVED" || ps.status === "SUNK")
      ?.map(ps => String(ps.problemId?._id || ps.problemId)) || [];

    // Map solved problems back to algorithm IDs using the master question list
    const solvedAlgoIds = new Set();
    allR2Questions.forEach(q => {
      if (solvedProblemIds.includes(String(q._id))) {
        q.allowedAlgorithms.forEach(aid => solvedAlgoIds.add(String(aid)));
      }
    });

    // Match won scrolls against allAlgoCards, filtering out those already solved
    return allAlgoCards
      .filter(card => {
        const normalizedCardName = card.name.toLowerCase().replace(/\s+/g, '');
        const isWon = wonScrollNames.includes(normalizedCardName);
        const isSolved = solvedAlgoIds.has(String(card._id));
        return isWon && !isSolved;
      })
      .map(card => ({
        id: card._id,
        name: card.name,
        color: "#c9a84c",
        realId: card._id
      }));
  }, [team, allAlgoCards, allR2Questions]);

  // Filter selectedCards to only include available ones
  // Only run this when both team and algo cards are fully loaded
  React.useEffect(() => {
    if (!isTeamFetched || allAlgoCards.length === 0) return;

    setSelectedCards(prev => prev.filter(card =>
      availableCards.some(ac => (ac.id === card.id || ac.name === card.name))
    ));
  }, [availableCards, isTeamFetched, allAlgoCards.length]);


  // Island Graph Data - Easy to adjust size and position
  const islands = [
    { id: 1, name: "Isla Muerta", img: island1, top: "60%", left: "0%", size: "340px" },
    { id: 2, name: "Tortuga Island", img: island2, top: "60%", left: "69%", size: "390px" },
    { id: 3, name: "Port Royal", img: island3, top: "2%", left: "55%", size: "340px" }
  ];

  const solvedCardIds = React.useMemo(() => {
    if (!team?.round2?.problemsStatus || !r2Questions.length) return [];
    const solvedProblemIdsStr = team.round2.problemsStatus
      .filter(ps => ps.status === "SOLVED" || ps.status === "SUNK")
      .map(ps => String(ps.problemId._id || ps.problemId));

    const solvedCards = [];
    r2Questions.forEach(q => {
      if (solvedProblemIdsStr.includes(String(q._id))) {
        const matchingCard = selectedCards.find(c => q.allowedAlgorithms.includes(c.realId));
        if (matchingCard) solvedCards.push(matchingCard.id);
      }
    });
    return solvedCards;
  }, [team, r2Questions, selectedCards]);

  const allCurrentSolved = React.useMemo(() => {
    if (!selectedCards.length) return false;
    return selectedCards.every(c => solvedCardIds.includes(c.id));
  }, [selectedCards, solvedCardIds]);

  // Persist State to LocalStorage
  React.useEffect(() => {
    localStorage.setItem('kriya_found_objects', JSON.stringify(foundObjects));
    localStorage.setItem('kriya_target_index', currentTargetIndex.toString());
    localStorage.setItem('kriya_selected_cards', JSON.stringify(selectedCards));

    // Auto-fix if cards were cleared but state said they were chosen
    // Also auto-fix if local storage thinks cards are chosen, but the database has no round2 questions assigned
    const minRequired = Math.min(3, availableCards.length);
    const noBackendMapping = isTeamFetched && team && (!team.round2?.problemsStatus || team.round2.problemsStatus.length === 0);

    if (cardsChosen && (selectedCards.length < minRequired || noBackendMapping)) {
      setCardsChosen(false);
      localStorage.setItem('kriya_cards_chosen', "false");
    } else {
      localStorage.setItem('kriya_cards_chosen', cardsChosen.toString());
    }

    // Check for new solved problems to show success banner
    if (team?.round2?.problemsStatus) {
      const currentSolved = team.round2.problemsStatus.filter(ps => ps.status === "SOLVED").length;
      if (currentSolved > lastSolvedCount) {
        setShowSuccess(true);
        setLastSolvedCount(currentSolved);
        localStorage.setItem('kriya_solved_count', currentSolved.toString());
        setTimeout(() => setShowSuccess(false), 5000);
      }
    }
  }, [foundObjects, currentTargetIndex, selectedCards, cardsChosen, isTeamFetched, team, lastSolvedCount]);

  // Clear old sync data if it exists
  React.useEffect(() => {
    localStorage.removeItem('kriya_island_config');
    setIsLoading(true);
    Promise.all([
      fetchTeamData(),
      fetchAlgos()
    ]).finally(() => {
      setTimeout(() => setIsLoading(false), 800);
    });
  }, []);

  // Enrich selectedCards with realId once allAlgoCards are loaded
  React.useEffect(() => {
    if (allAlgoCards.length > 0 && selectedCards.length > 0) {
      let changed = false;
      const enriched = selectedCards.map(sc => {
        if (sc.realId) return sc;
        const normalizedName = (sc.name || '').toLowerCase().replace(/\s+/g, '');
        const match = allAlgoCards.find(ac => ac.name.toLowerCase().replace(/\s+/g, '') === normalizedName);
        if (match) {
          changed = true;
          return { ...sc, realId: match._id };
        }
        return sc;
      });
      if (changed) {
        console.log("Enriched selected cards with IDs");
        setSelectedCards(enriched);
      }
    }
  }, [allAlgoCards]);

  // Fetch questions when cards are chosen and have IDs
  React.useEffect(() => {
    const minRequired = Math.min(3, availableCards.length);
    if (cardsChosen && selectedCards.length >= minRequired && selectedCards.length > 0) {
      // Only fetch if they all have realId or we wait for enrichment
      const hasAllIds = selectedCards.every(c => c.realId);
      if (hasAllIds) {
        fetchR2Questions(selectedCards);
      }
    }
  }, [cardsChosen, selectedCards, availableCards.length]);

  async function fetchPlayerActionCards(kriyaID) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/actionCards/claimed/${kriyaID}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUnlockedActionCards(data.claimedActionCards || []);
    } catch (err) {
      console.error("Failed to fetch player action cards", err);
    }
  }

  async function fetchTeamData() {
    const storedTeam = JSON.parse(localStorage.getItem("team"));
    const token = localStorage.getItem("token");
    if (!storedTeam || (!storedTeam.id && !storedTeam._id && !storedTeam.kriyaID && !storedTeam.kriyaId && !storedTeam.kriyaid)) return null;

    const teamId = storedTeam.id || storedTeam._id || storedTeam.kriyaID || storedTeam.kriyaId || storedTeam.kriyaid;

    try {
      const res = await fetch(`${API_BASE}/api/teams/profile/${teamId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTeam(data);
        setIsTeamFetched(true);
        localStorage.setItem("team", JSON.stringify(data));
        // Don't auto-set selectedCards from scrolls here, 
        // as they might not be enriched with IDs yet.
        // Let the localStorage or manual selection handle it.
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch team data", err);
    }
    return null;
  }

  async function fetchAlgos() {
    try {
      const res = await fetch(`${API_BASE}/api/algorithms`);
      const data = await res.json();
      if (res.ok) setAllAlgoCards(data);
    } catch (err) {
      console.error("Failed to fetch algorithms", err);
    }
  }

  const fetchR2Questions = async (pickedCards = selectedCards, providedTeam = null) => {
    try {
      console.log("Fetching questions for Round 2...");
      const activeTeam = providedTeam || team;
      const res = await fetch(`${API_BASE}/api/round2/questions`);
      const allQuestions = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch all questions from DB");
        return;
      }

      let islandQuestions = [];

      // Priority 1: Use specific questions assigned to the team in backend
      if (activeTeam?.round2?.problemsStatus && activeTeam.round2.problemsStatus.length > 0) {
        console.log("Mapping questions from team's assigned problems...");
        islandQuestions = activeTeam.round2.problemsStatus.map(ps => {
          const pid = String(ps.problemId._id || ps.problemId);
          return allQuestions.find(q => String(q._id) === pid);
        }).filter(Boolean);
      }

      // Priority 2: Fallback to mapping by selected algorithm IDs if priority 1 yielded nothing
      if (islandQuestions.length === 0 && pickedCards && pickedCards.length > 0) {
        console.log("Fallback: Mapping questions by selected algorithm scrolls...");
        const cardIds = pickedCards.map(c => String(c.realId || c.id || c._id)).filter(Boolean);

        islandQuestions = cardIds.map(sid => {
          return allQuestions.find(q =>
            q.allowedAlgorithms && q.allowedAlgorithms.some(aid => String(aid) === sid)
          );
        }).filter(Boolean);
      }

      if (islandQuestions.length > 0) {
        setR2Questions(islandQuestions);
        localStorage.setItem('kriya_r2_questions', JSON.stringify(islandQuestions));
        console.log(`Successfully mapped ${islandQuestions.length} quests to islands.`);
      } else {
        console.warn("Could not map any quests. Islands might appear blank.");
      }
    } catch (err) {
      console.error("Error in fetchR2Questions:", err);
    }
  };

  const decorations = [
    { id: "d1", img: obj1, top: "20%", left: "20%", size: "80px" },
    { id: "d2", img: obj2, top: "10%", left: "90%", size: "90px" },
    { id: "d3", img: obj3, top: "75%", left: "48%", size: "50px" },
    { id: "d4", img: obj4, top: "40%", left: "80%", size: "70px" },
  ];

  const handleMouseMove = (e) => {
    if (!isTreasureHunting || currentTargetIndex >= decorations.length) return;

    const mapImgElement = e.currentTarget.querySelector(".map-background");

    if (!mapImgElement) return;

    const imgRect = mapImgElement.getBoundingClientRect();

    // Calculate cursor position relative to the ACTUAL image bounds
    const mouseInImgX = e.clientX - imgRect.left;
    const mouseInImgY = e.clientY - imgRect.top;

    // Current shovel position for state
    setCursorPos({ x: e.clientX, y: e.clientY });

    const target = decorations[currentTargetIndex];

    // Convert target % coordinates to pixels based on the ACTUAL image size
    const targetX = (parseFloat(target.left) / 100) * imgRect.width;
    const targetY = (parseFloat(target.top) / 100) * imgRect.height;

    // Calculate angle from the mouse (within image) to target (within image)
    const dx = targetX - mouseInImgX;
    const dy = targetY - mouseInImgY;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    setCompassRotation(angle + 90); // +90 because the emoji needle points "up" (North)
  };

  const handleMapClick = (e) => {
    if (!isTreasureHunting || currentTargetIndex >= decorations.length) return;

    const mapImgElement = e.currentTarget.querySelector(".map-background");
    if (!mapImgElement) return;

    const imgRect = mapImgElement.getBoundingClientRect();

    // Cursor relative to the image
    const mouseInImgX = e.clientX - imgRect.left;
    const mouseInImgY = e.clientY - imgRect.top;

    const target = decorations[currentTargetIndex];
    const targetX = (parseFloat(target.left) / 100) * imgRect.width;
    const targetY = (parseFloat(target.top) / 100) * imgRect.height;

    // Distance check relative to the image scaling
    const distance = Math.sqrt(
      Math.pow(targetX - mouseInImgX, 2) + Math.pow(targetY - mouseInImgY, 2),
    );

    if (distance < 60) {
      const newFound = [...foundObjects, target.id];
      setFoundObjects(newFound);
      setCurrentTargetIndex(currentTargetIndex + 1);

      if (currentTargetIndex + 1 >= decorations.length) {
        setTimeout(() => {
          setIsTreasureHunting(false);
          alert("Complete! Map decorated.");
        }, 500);
      }
    }
  };

  const handleSelectCard = (card) => {
    if (
      selectedCards.length < 3 &&
      !selectedCards.find((c) => c.id === card.id)
    ) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleConfirmSelection = async () => {
    const minRequired = Math.min(3, availableCards.length);
    if (selectedCards.length >= minRequired && selectedCards.length <= 3) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/teams/round2answers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            selectedScrolls: selectedCards.map(c => c.realId)
          })
        });

        if (res.ok) {
          setCardsChosen(true);
          setIsPopupOpen(false);
          // High priority: Refresh team data first to get assigned problemsStatus
          const updatedTeam = await fetchTeamData();
          // Then fetch full question objects using that fresh status
          fetchR2Questions(selectedCards, updatedTeam);
        } else {
          const data = await res.json();
          alert(data.msg || "Failed to initialize Round 2 session.");
        }
      } catch (err) {
        console.error("Error initializing Round 2", err);
        alert("Network error. Could not chart your course.");
      }
    }
  };

  const handleRemoveCard = (cardId) => {
    setSelectedCards(selectedCards.filter(c => c.id !== cardId));
  };

  const handleObjClick = (objId) => {
    if (CHALLENGES[objId] && foundObjects.includes(objId)) {
      setActiveChallenge(CHALLENGES[objId]);
      setIsFlagModalOpen(true);
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!activeChallenge) return;

    const token = localStorage.getItem("token");
    const storedTeam = JSON.parse(localStorage.getItem("team") || "{}");
    // Use kriyaID from state, or fallback to localStorage
    const kriyaID = team?.kriyaID || storedTeam.kriyaID || storedTeam.id || storedTeam._id;

    if (!kriyaID) {
      alert("Team session not found. Please log in again.");
      return;
    }

    if (flagInput.trim() === activeChallenge.flag) {
      try {
        // Award card via backend
        const res = await fetch(`${API_BASE}/api/players/${kriyaID}/minigame-complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ baseReward: 10 })
        });
        const result = await res.json();

        if (res.ok) {
          if (result.card) {
            alert(`Success! You have won the ${result.card.name} action card!`);
            // Refresh inventory
            fetchPlayerActionCards(kriyaID);
          } else {
            alert("Success! You have already claimed all available action cards.");
          }
        } else {
          alert(result.msg || "Failed to claim reward.");
        }
      } catch (err) {
        console.error("Error submitting flag", err);
        alert("An error occurred while claiming your reward.");
      }
      setIsFlagModalOpen(false);
      setFlagInput("");
    } else {
      alert("Incorrect flag! Try again.");
    }
  };

  const handleUseCard = async (cardName) => {
    if (!window.confirm(`Are you sure you want to use the ${cardName} card?`)) return;

    const token = localStorage.getItem("token");
    const storedTeam = JSON.parse(localStorage.getItem("team") || "{}");
    const kriyaID = team?.kriyaID || storedTeam.kriyaID || storedTeam.id || storedTeam._id;

    if (!kriyaID) {
      alert("Team session not found. Please log in again.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/actionCards/activate/${kriyaID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ cardName })
      });
      const result = await res.json();

      if (res.ok) {
        alert(`Card Activated: ${result.message}`);
        // Refresh inventory
        fetchPlayerActionCards(kriyaID);
      } else {
        alert(result.msg || result.message || "Failed to activate card.");
      }
    } catch (err) {
      console.error("Error using card", err);
      alert("An error occurred while using the card.");
    }
  };

  if (isLoading) {
    return (
      <div className="map-loading-screen" style={{ background: '#040a0e', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', gap: '20px' }}>
        <div className="loading-spinner" style={{ width: '60px', height: '60px', border: '3px solid rgba(201, 168, 76, 0.2)', borderTop: '3px solid #c9a84c', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h2 style={{ fontFamily: "'Pirata One', cursive", fontSize: '2rem', letterSpacing: '4px' }}>Charting Course...</h2>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Verifying scrolls and plundered goods</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      className={`map-page-container ${isTreasureHunting ? "treasure-hunting-active" : ""}`}
    >
      {showSuccess && (
        <div className="success-banner" style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(76, 175, 80, 0.9)', color: 'white', padding: '12px 30px', borderRadius: '50px', zIndex: 1000, boxShadow: '0 0 20px rgba(76, 175, 80, 0.5)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'bannerPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <span>🎉</span>
          <strong>Quest Plundered!</strong>
          <span>New points added to your bounty.</span>
          <style>{`@keyframes bannerPop { 0% { transform: translateX(-50%) translateY(-50px); opacity: 0; } 100% { transform: translateX(-50%) translateY(0); opacity: 1; } }`}</style>
        </div>
      )}
      <div
        className="map-viewport"
        onMouseMove={handleMouseMove}
        onClick={handleMapClick}
        style={{ cursor: isTreasureHunting ? "none" : "default" }}
      >
        <img src={mapImg} alt="World Map" className="map-background" />

        <div className="islands-layer">
          {islands.map((island, idx) => {
            const hasQuestion = r2Questions[idx] != null;
            const isIslandSolved = hasQuestion && team?.round2?.problemsStatus?.some(ps =>
              String(ps.problemId._id || ps.problemId) === String(r2Questions[idx]._id) &&
              (ps.status === "SOLVED" || ps.status === "SUNK")
            );

            return (
              <div
                key={island.id}
                className={`island-node island-${island.id}`}
                style={{
                  top: island.top,
                  left: island.left,
                  cursor: (cardsChosen && hasQuestion && !isIslandSolved) ? "pointer" : "not-allowed",
                  opacity: (cardsChosen && hasQuestion && !isIslandSolved) ? 1 : 0.6
                }}
                onClick={() => {
                  if (isTreasureHunting) return;
                  if (!cardsChosen) {
                    alert("Please choose 3 algorithm cards to chart your course first!");
                    return;
                  }
                  if (isIslandSolved) {
                    alert("This quest has already been completed!");
                    return;
                  }
                  if (hasQuestion && r2Questions[idx]._id) {
                    navigate(`/arena`, { state: { problemId: r2Questions[idx]._id, problem: r2Questions[idx] } });
                  } else {
                    alert("No quest found for this island based on your scrolls.");
                  }
                }}
              >
                <img
                  src={island.img}
                  alt={island.name}
                  className="island-image"
                  style={{ width: island.size || "150px" }}
                />
                <div className="island-info">
                  <span className="island-name">{island.name}</span>
                  {cardsChosen && hasQuestion && !isIslandSolved && <span style={{ fontSize: '0.7rem', color: '#c9a84c', display: 'block' }}>⚔️ Quest Ready</span>}
                  {isIslandSolved && <span style={{ fontSize: '0.7rem', color: '#4caf50', display: 'block' }}>✅ Completed</span>}
                </div>
              </div>
            );
          })}

          {/* Decorations Layer */}
          {decorations.map(obj => {
            const challenge = CHALLENGES[obj.id];
            // Check if team already has this reward (simplified: if they have any card for this challenge)
            // Since rewards are random, it's hard to track per-challenge. 
            // For now, let's just show '!' if it's an interactive object.
            const isInteractive = challenge && foundObjects.includes(obj.id);

            return (
              <div
                key={obj.id}
                className={`map-decoration ${foundObjects.includes(obj.id) ? 'found' : 'hidden'} ${isInteractive ? 'interactive' : ''}`}
                style={{
                  top: obj.top,
                  left: obj.left,
                  width: obj.size
                }}
                onClick={(e) => {
                  if (foundObjects.includes(obj.id)) {
                    e.stopPropagation();
                    handleObjClick(obj.id);
                  }
                }}
              >
                <img src={obj.img} alt="Map Decoration" className="decoration-image" />
                {isInteractive && (
                  <div className="interactive-hint">!</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <nav className="card-navbar">
        <div className="navbar-left">
          <div className="selected-cards-container">
            {[0, 1, 2].map((index) => {
              const card = selectedCards[index];
              const isSolved = card && solvedCardIds.includes(card.id);
              return (
                <div key={index} className="card-slot portrait-card">
                  {card && !isSolved ? (
                    <div
                      className="card-content"
                      style={{ backgroundColor: card.color }}
                    >
                      <span>{card.name}</span>
                    </div>
                  ) : (
                    <div className="card-placeholder">{isSolved ? "✨" : "?"}</div>
                  )}
                </div>
              )
            })}
          </div>

          {(!cardsChosen || (cardsChosen && allCurrentSolved && availableCards.length > 0)) && (
            <div
              className="choose-cards-option"
              onClick={() => {
                if (allCurrentSolved) {
                  // Reset local selection to pick new cards
                  setSelectedCards([]);
                  setCardsChosen(false);
                  setIsPopupOpen(true);
                } else {
                  setIsPopupOpen(true);
                }
              }}
            >
              <div className="plus-icon">{allCurrentSolved ? "🔄" : "+"}</div>
              <span>{allCurrentSolved ? "Chart New Voyage" : "Choose Cards"}</span>
            </div>
          )}
          {cardsChosen && allCurrentSolved && availableCards.length === 0 && (
            <div className="all-complete-msg" style={{ color: '#4caf50', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}>
              <span>🏆</span>
              <span>All Round 2 Quests Plundered!</span>
            </div>
          )}
        </div>

        <div className="navbar-right">
          <div className="nav-actions-group">
            <div className="score-display" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(201, 168, 76, 0.2)', borderRadius: '4px', border: '1px solid #c9a84c', color: '#fff', fontWeight: 'bold' }}>
              <span style={{ fontSize: '1.2rem' }}>🪙</span>
              <span>Pts: {team?.totalScore || 0}</span>
            </div>
            {foundObjects.length < decorations.length && (
              <div
                className={`treasure-hunt-btn ${isTreasureHunting ? "active" : ""}`}
                onClick={() => setIsTreasureHunting(!isTreasureHunting)}
              >
                <div className="treasure-icon">💎</div>
                <span>{isTreasureHunting ? "Cancel" : "Find Treasure"}</span>
              </div>
            )}
            <div
              className="action-cards-btn"
              onClick={() => setIsActionPopupOpen(true)}
            >
              <div className="action-icon">⚡</div>
              <span>Action Cards</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="map-overlay">
        {/* Future overlay content like pins or labels can go here */}
      </div>

      {/* Treasure Hunt UI Layer - Absolute Top Z-Index */}
      {isTreasureHunting && (
        <>
          {/* Shovel Cursor */}
          <div
            className="shovel-cursor"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
            }}
          >
            <img src={shovelImg} alt="Shovel Cursor" className="shovel-image" />
          </div>

          {/* Fixed Radar Compass */}
          {currentTargetIndex < decorations.length && (
            <div className="fixed-treasure-compass">
              <div
                className="compass-needle"
                style={{ transform: `rotate(${compassRotation}deg)` }}
              >
                🧭
              </div>
              <div className="compass-label">Radar</div>
            </div>
          )}
        </>
      )}

      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Select {Math.min(3, availableCards.length)} Cards</h2>
            {availableCards.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#ccc' }}>
                <p>You haven't won any algorithm cards yet!</p>
                <p>Go back to the Anchorage and solve chests to earn scrolls.</p>
              </div>
            ) : (
              <div className="available-cards-grid">
                {availableCards.map((card) => {
                  const isSelected = selectedCards.find((c) => c.id === card.id);
                  return (
                    <div
                      key={card.id}
                      className={`available-card portrait-card ${isSelected ? "selected" : ""}`}
                      onClick={() =>
                        isSelected
                          ? handleRemoveCard(card.id)
                          : handleSelectCard(card)
                      }
                    >
                      <div
                        className="card-content"
                        style={{ backgroundColor: card.color }}
                      >
                        <span>{card.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="popup-actions">
              <button
                className="confirm-btn"
                disabled={selectedCards.length === 0 || (availableCards.length >= 3 && selectedCards.length < 3)}
                onClick={handleConfirmSelection}
              >
                Confirm Selection ({selectedCards.length}/{Math.min(3, availableCards.length)})
              </button>
              <button
                className="cancel-btn"
                onClick={() => setIsPopupOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isActionPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-content action-popup">
            <h2>Action Cards</h2>
            <div className="action-cards-grid">
              {unlockedActionCards.length > 0 ? (
                unlockedActionCards.map((item, index) => (
                  <div key={index} className="action-card-item">
                    <div className="action-card-visual" style={{ backgroundColor: "#2c3e50" }}>
                      <span className="action-card-name">{item.name}</span>
                    </div>
                    <p className="action-card-desc">{item.description}</p>
                    <button
                      className="use-card-btn"
                      onClick={() => handleUseCard(item.name)}
                    >
                      USE
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-cards-msg">
                  <p>No action cards collected yet.</p>
                  <p>Find treasure and solve challenges to unlock them!</p>
                </div>
              )}
            </div>
            <div className="popup-actions">
              <button className="confirm-btn" onClick={() => setIsActionPopupOpen(false)}>
                Back to Map
              </button>
            </div>
          </div>
        </div>
      )}

      {isFlagModalOpen && (
        <div className="popup-overlay" onClick={() => setIsFlagModalOpen(false)}>
          <div className="popup-content flag-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{activeChallenge?.title || "Mysterious Portal Found!"}</h2>
              <p>You found an ancient artifact. It seems to lead to a hidden challenge.</p>
            </div>

            <div className="modal-body">
              <div className="challenge-link-box">
                <p>Enter the portal to find the hidden flag:</p>
                <a
                  href={activeChallenge?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mini-game-link"
                >
                  Enter Portal ➔
                </a>
              </div>

              <form className="flag-submit-form" onSubmit={handleFlagSubmit}>
                <label>Enter the Flag revealed in the mini-game:</label>
                <input
                  type="text"
                  placeholder="FLAG{...}"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  required
                />
                <button type="submit" className="confirm-btn">Claim Reward</button>
              </form>
            </div>

            <div className="popup-actions">
              <button className="cancel-btn" onClick={() => setIsFlagModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default MapPage;