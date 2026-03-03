import React, { useState } from "react";
import "../styles/adminPage.css";

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState("teams");
    const [teams, setTeams] = useState([
        { id: 1, name: "Alpha Squad", points: 1200, algoCards: ["Merge Sort"], actionCards: ["Steal Points"], currentQuestionNo: 1 },
        { id: 2, name: "Binary bandits", points: 950, algoCards: ["Dijkstra"], actionCards: ["Freeze Team"], currentQuestionNo: 3 },
        { id: 3, name: "Cyber Knights", points: 800, algoCards: [], actionCards: ["Double Points"], currentQuestionNo: 5 },
    ]);

    const ALL_ALGO_CARDS = ["Quick Sort", "DFS", "Dynamic Programming", "Dijkstra", "Binary Search", "BFS", "Merge Sort"];
    const ALL_ACTION_CARDS = ["Shield", "Point Stealer", "Time Warp", "Double Up", "Storm", "Kraken", "Freeze Team", "Steal Points"];

    const [editingTeamId, setEditingTeamId] = useState(null);
    const [pointsInput, setPointsInput] = useState("");

    const handleTeamClick = (id) => {
        setEditingTeamId(id);
        setPointsInput("");
    };

    const closeEditor = () => {
        setEditingTeamId(null);
    };

    const updateTeam = (id, updates) => {
        setTeams(teams.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handlePointsChange = () => {
        if (!editingTeamId || pointsInput === "") return;
        const team = teams.find(t => t.id === editingTeamId);
        updateTeam(editingTeamId, { points: team.points + parseInt(pointsInput) });
        setPointsInput("");
    };

    const toggleCard = (teamId, field, card, limit) => {
        const team = teams.find(t => t.id === teamId);
        const currentList = team[field] || [];
        const hasCard = currentList.includes(card);

        if (!hasCard && currentList.length >= limit) {
            alert(`Maximum of ${limit} ${field === 'algoCards' ? 'Algorithm' : 'Action'} cards allowed!`);
            return;
        }

        updateTeam(teamId, {
            [field]: hasCard
                ? currentList.filter(c => c !== card)
                : [...currentList, card]
        });
    };

    const sortedLeaderboard = [...teams].sort((a, b) => b.points - a.points);
    const editingTeam = teams.find(t => t.id === editingTeamId);

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <h2>KRIYA<span>2026 Admin</span></h2>
                </div>
                <nav className="admin-nav">
                    <button className={activeTab === "teams" ? "active" : ""} onClick={() => setActiveTab("teams")}>Teams Control</button>
                    <button className={activeTab === "leaderboard" ? "active" : ""} onClick={() => setActiveTab("leaderboard")}>Leaderboard</button>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1>{activeTab === "teams" ? "Live Operations" : "Current Rankings"}</h1>
                    <div className="admin-status">System Status: <span>Active</span></div>
                </header>

                <div className="admin-content-area">
                    {activeTab === "teams" && (
                        <div className="teams-management-view">
                            <div className="teams-wide-list">
                                {teams.map(team => (
                                    <div key={team.id} className="team-card-large" onClick={() => handleTeamClick(team.id)}>
                                        <div className="team-card-header">
                                            <span className="team-rank-badge">#{sortedLeaderboard.findIndex(t => t.id === team.id) + 1}</span>
                                            <h3>{team.name}</h3>
                                        </div>
                                        <div className="team-card-stats">
                                            <div className="stat-pill">Points: <span>{team.points}</span></div>
                                            <div className="stat-pill">Question: <span>{team.currentQuestionNo}</span></div>
                                            <div className="stat-pill">Algos: <span>{team.algoCards.length}/3</span></div>
                                            <div className="stat-pill">Actions: <span>{team.actionCards.length}/4</span></div>
                                        </div>
                                        <button className="manage-btn">Manage Team</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "leaderboard" && (
                        <div className="leaderboard-view">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Team Name</th>
                                        <th>Points</th>
                                        <th>Q. No</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedLeaderboard.map((team, index) => (
                                        <tr key={team.id} className={index < 3 ? "top-3" : ""}>
                                            <td>#{index + 1}</td>
                                            <td>{team.name}</td>
                                            <td>{team.points}</td>
                                            <td>{team.currentQuestionNo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Editing Modal */}
            {editingTeam && (
                <div className="modal-overlay" onClick={closeEditor}>
                    <div className="neat-modal" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>Managing: {editingTeam.name}</h2>
                                <p style={{ color: '#8b949e', fontSize: '0.8rem' }}>Force manipulate team state and resources</p>
                            </div>
                            <button className="close-modal-btn" onClick={closeEditor}>&times;</button>
                        </header>

                        <div className="modal-sections">
                            <div className="modal-section">
                                <h3>Points & Progression</h3>
                                <div className="progression-controls">
                                    <div className="control-box">
                                        <label>Modify Points</label>
                                        <div className="input-group-row">
                                            <input
                                                type="number"
                                                value={pointsInput}
                                                onChange={e => setPointsInput(e.target.value)}
                                                placeholder="e.g. 50 or -50"
                                            />
                                            <button className="apply-btn" onClick={handlePointsChange}>Update</button>
                                        </div>
                                    </div>
                                    <div className="control-box">
                                        <label>Current Question No.</label>
                                        <input
                                            type="number"
                                            value={editingTeam.currentQuestionNo}
                                            onChange={e => updateTeam(editingTeam.id, { currentQuestionNo: parseInt(e.target.value) || 1 })}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section">
                                <div className="section-header-row">
                                    <h3>Algorithm Cards</h3>
                                    <span className="limit-count">{editingTeam.algoCards.length}/3 Slots Used</span>
                                </div>
                                <div className="card-pill-grid">
                                    {ALL_ALGO_CARDS.map(card => {
                                        const active = editingTeam.algoCards.includes(card);
                                        return (
                                            <button
                                                key={card}
                                                className={`action-pill algo ${active ? 'active' : ''}`}
                                                onClick={() => toggleCard(editingTeam.id, 'algoCards', card, 3)}
                                            >
                                                {card} {active ? '✓' : '+'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="modal-section">
                                <div className="section-header-row">
                                    <h3>Action Cards</h3>
                                    <span className="limit-count">{editingTeam.actionCards.length}/4 Slots Used</span>
                                </div>
                                <div className="card-pill-grid">
                                    {ALL_ACTION_CARDS.map(card => {
                                        const active = editingTeam.actionCards.includes(card);
                                        return (
                                            <button
                                                key={card}
                                                className={`action-pill ${active ? 'active' : ''}`}
                                                onClick={() => toggleCard(editingTeam.id, 'actionCards', card, 4)}
                                            >
                                                {card} {active ? '✓' : '+'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <footer className="modal-footer">
                            <button className="done-btn" onClick={closeEditor}>Save & Close</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
