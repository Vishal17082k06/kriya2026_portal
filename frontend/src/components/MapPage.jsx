import React, { useState } from "react";
import mapImg from "../assets/roundbg.png";
import island1 from "../assets/island1.png";
import island2 from "../assets/island2.png";
import island3 from "../assets/island3.png";
import obj1 from "../assets/obj1.png";
import obj2 from "../assets/obj2.png";
import obj3 from "../assets/obj3.png";
import shovelImg from "../assets/shovel.png";
import "../styles/mapPage.css";

const MapPage = () => {
    const [selectedCards, setSelectedCards] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isActionPopupOpen, setIsActionPopupOpen] = useState(false);
    const [cardsChosen, setCardsChosen] = useState(false);

    // Treasure Hunt State
    const [isTreasureHunting, setIsTreasureHunting] = useState(false);
    const [foundObjects, setFoundObjects] = useState([]); // Array of IDs
    const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
    const [compassRotation, setCompassRotation] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

    // Dummy card data
    const availableCards = [
        { id: 1, name: "The Navigator", color: "#3498db" },
        { id: 2, name: "The Explorer", color: "#e67e22" },
        { id: 3, name: "The Merchant", color: "#2ecc71" },
        { id: 4, name: "The Pirate", color: "#e74c3c" },
        { id: 5, name: "The Scholar", color: "#9b59b6" },
        { id: 6, name: "The Guard", color: "#f1c40f" }
    ];

    const actionCards = [
        { id: 101, name: "Storm", color: "#4b6584", desc: "Create a coastal storm" },
        { id: 102, name: "Bounty", color: "#f7b731", desc: "Double gold for 1 turn" },
        { id: 103, name: "Kraken", color: "#eb3b5a", desc: "Summon a sea monster" },
        { id: 104, name: "Mist", color: "#a5b1c2", desc: "Hide ship movements" }
    ];

    // Island Graph Data - easy to adjust coordinates here
    const islands = [
        { id: 1, name: "Azure Haven", img: island1, top: "65%", left: "5%" },
        { id: 2, name: "Emerald Isle", img: island2, top: "60%", left: "70%" },
        { id: 3, name: "Storm Peak", img: island3, top: "15%", left: "50%" }
    ];

    const decorations = [
        { id: "d1", img: obj1, top: "20%", left: "20%", size: "80px" },
        { id: "d2", img: obj2, top: "10%", left: "90%", size: "90px" },
        { id: "d3", img: obj3, top: "75%", left: "48%", size: "50px" }
    ];

    const handleMouseMove = (e) => {
        if (!isTreasureHunting || currentTargetIndex >= decorations.length) return;

        const viewport = e.currentTarget.getBoundingClientRect();
        const mapImgElement = e.currentTarget.querySelector('.map-background');

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

        const mapImgElement = e.currentTarget.querySelector('.map-background');
        if (!mapImgElement) return;

        const imgRect = mapImgElement.getBoundingClientRect();

        // Cursor relative to the image
        const mouseInImgX = e.clientX - imgRect.left;
        const mouseInImgY = e.clientY - imgRect.top;

        const target = decorations[currentTargetIndex];
        const targetX = (parseFloat(target.left) / 100) * imgRect.width;
        const targetY = (parseFloat(target.top) / 100) * imgRect.height;

        // Distance check relative to the image scaling
        const distance = Math.sqrt(Math.pow(targetX - mouseInImgX, 2) + Math.pow(targetY - mouseInImgY, 2));

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
        if (selectedCards.length < 3 && !selectedCards.find(c => c.id === card.id)) {
            setSelectedCards([...selectedCards, card]);
        }
    };

    const handleConfirmSelection = () => {
        if (selectedCards.length === 3) {
            setCardsChosen(true);
            setIsPopupOpen(false);
        }
    };

    const handleRemoveCard = (cardId) => {
        setSelectedCards(selectedCards.filter(c => c.id !== cardId));
    };

    return (
        <div className="map-page-container">
            <div
                className="map-viewport"
                onMouseMove={handleMouseMove}
                onClick={handleMapClick}
                style={{ cursor: isTreasureHunting ? 'none' : 'default' }}
            >
                <img src={mapImg} alt="World Map" className="map-background" />

                <div className="islands-layer">
                    {islands.map(island => (
                        <div
                            key={island.id}
                            className={`island-node island-${island.id}`}
                            style={{ top: island.top, left: island.left }}
                        >
                            <img src={island.img} alt={island.name} className="island-image" />
                            <div className="island-info">
                                <span className="island-name">{island.name}</span>
                            </div>
                        </div>
                    ))}

                    {/* Decorations Layer */}
                    {decorations.map(obj => (
                        <div
                            key={obj.id}
                            className={`map-decoration ${foundObjects.includes(obj.id) ? 'found' : 'hidden'}`}
                            style={{
                                top: obj.top,
                                left: obj.left,
                                width: obj.size
                            }}
                        >
                            <img src={obj.img} alt="Map Decoration" className="decoration-image" />
                        </div>
                    ))}
                </div>
            </div>

            <nav className="card-navbar">
                <div className="navbar-left">
                    <div className="selected-cards-container">
                        {[0, 1, 2].map((index) => (
                            <div key={index} className="card-slot portrait-card">
                                {selectedCards[index] ? (
                                    <div
                                        className="card-content"
                                        style={{ backgroundColor: selectedCards[index].color }}
                                    >
                                        <span>{selectedCards[index].name}</span>
                                    </div>
                                ) : (
                                    <div className="card-placeholder">?</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {!cardsChosen && (
                        <div className="choose-cards-option" onClick={() => setIsPopupOpen(true)}>
                            <div className="plus-icon">+</div>
                            <span>Choose Cards</span>
                        </div>
                    )}
                </div>

                <div className="navbar-right">
                    <div className="nav-actions-group">
                        <div
                            className={`treasure-hunt-btn ${isTreasureHunting ? 'active' : ''}`}
                            onClick={() => setIsTreasureHunting(!isTreasureHunting)}
                        >
                            <div className="treasure-icon">💎</div>
                            <span>{isTreasureHunting ? 'Cancel' : 'Find Treasure'}</span>
                        </div>
                        <div className="action-cards-btn" onClick={() => setIsActionPopupOpen(true)}>
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
                            top: cursorPos.y
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
                        <h2>Select 3 Cards</h2>
                        <div className="available-cards-grid">
                            {availableCards.map((card) => {
                                const isSelected = selectedCards.find(c => c.id === card.id);
                                return (
                                    <div
                                        key={card.id}
                                        className={`available-card portrait-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => isSelected ? handleRemoveCard(card.id) : handleSelectCard(card)}
                                    >
                                        <div className="card-content" style={{ backgroundColor: card.color }}>
                                            <span>{card.name}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="popup-actions">
                            <button
                                className="confirm-btn"
                                disabled={selectedCards.length !== 3}
                                onClick={handleConfirmSelection}
                            >
                                Confirm Selection ({selectedCards.length}/3)
                            </button>
                            <button className="cancel-btn" onClick={() => setIsPopupOpen(false)}>
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
                            {actionCards.map((card) => (
                                <div key={card.id} className="action-card-item">
                                    <div className="action-card-visual" style={{ backgroundColor: card.color }}>
                                        <span className="action-card-name">{card.name}</span>
                                    </div>
                                    <p className="action-card-desc">{card.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="popup-actions">
                            <button className="confirm-btn" onClick={() => setIsActionPopupOpen(false)}>
                                Back to Map
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;
