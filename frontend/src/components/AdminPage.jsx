import { API_BASE as BASE_URL } from "../config/api";

const ADMIN_API = `${BASE_URL}/api/admin`;

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState("teams");
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Round 1 State
    const [round1Questions, setRound1Questions] = useState([]);
    const [isQModalOpen, setIsQModalOpen] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [qForm, setQForm] = useState({
        seaNumber: 1,
        qType: "MCQ",
        questionText: "",
        imageUrl: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        timeLimitSec: 60
    });

    // Round 2 State
    const [round2Questions, setRound2Questions] = useState([]);
    const [isR2ModalOpen, setIsR2ModalOpen] = useState(false);
    const [editingR2Id, setEditingR2Id] = useState(null);
    const [r2Form, setR2Form] = useState({
        title: "",
        description: "",
        allowedAlgorithms: [],
        timeLimitSec: 300,
        testCases: [{ input: "", output: "", isHidden: false }]
    });

    const [algorithmCards, setAlgorithmCards] = useState([]);

    // Auth state
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("adminToken"));
    const [loginData, setLoginData] = useState({ username: "", password: "" });
    const [authLoading, setAuthLoading] = useState(false);

    const [editingTeamId, setEditingTeamId] = useState(null);
    const [pointsInput, setPointsInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const ALL_ALGO_CARDS = []; // Empty as per backend
    const ALL_ACTION_CARDS = []; // Empty as per backend

    useEffect(() => {
        if (isLoggedIn) {
            fetchTeams();
            fetchRound1Questions();
            fetchRound2Questions();
            fetchAlgorithmCards();
        }
    }, [isLoggedIn]);

    const fetchAlgorithmCards = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${API_BASE}/algorithmcard`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setAlgorithmCards(data);
        } catch (err) {
            console.error("Failed to fetch algo cards", err);
        }
    };

    const fetchRound2Questions = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${API_BASE}/round2/questions`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setRound2Questions(data);
        } catch (err) {
            console.error("Failed to fetch round 2 questions", err);
        }
    };

    const fetchRound1Questions = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${ADMIN_API}/round1/questions`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                // Map backend keys to frontend expectations
                const mappedQuestions = data.map(q => ({
                    ...q,
                    _id: q._id,
                    seaNumber: q.seaNumber || 1,
                    qType: q.qType || q.questionType || "MCQ",
                    questionText: q.questionText || q.question || "No text provided",
                    correctAnswer: q.correctAnswer || q.answer || "N/A",
                    timeLimitSec: q.timeLimitSec || 60,
                    options: q.options && q.options.length > 0 ? q.options : ["A", "B", "C", "D"]
                }));
                setRound1Questions(mappedQuestions);
            }
        } catch (err) {
            console.error("Failed to fetch questions", err);
        }
    };

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${ADMIN_API}/teams`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                // Map backend Team schema to frontend state
                const mappedTeams = data.map(team => ({
                    id: team._id,
                    name: team.teamName,
                    points: team.totalScore || 0,
                    algoCards: [],
                    actionCards: [],
                    currentQuestionNo: team.currentQuestionNo || 1
                }));
                setTeams(mappedTeams);
                setError(null);
            } else {
                if (res.status === 401) {
                    handleLogout();
                }
                setError(data.msg || "Failed to fetch teams");
            }
        } catch (err) {
            setError("Cannot connect to server. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            const res = await fetch(`${ADMIN_API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData)
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("adminToken", data.token);
                setIsLoggedIn(true);
            } else {
                alert(data.msg || "Login failed");
            }
        } catch (err) {
            alert("Connection error: " + err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        setIsLoggedIn(false);
    };



    const handleTeamClick = (id) => {
        setEditingTeamId(id);
        setPointsInput("");
    };

    const closeEditor = () => {
        setEditingTeamId(null);
    };

    const handlePointsChange = async () => {
        if (!editingTeamId || pointsInput === "") return;
        const team = teams.find(t => t.id === editingTeamId);
        const newTotalScore = team.points + parseInt(pointsInput);

        try {
            const token = localStorage.getItem("adminToken");
            const res = await fetch(`${ADMIN_API}/teams/${editingTeamId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ totalScore: newTotalScore })
            });
            const data = await res.json();
            if (res.ok) {
                setTeams(teams.map(t => t.id === editingTeamId ? { ...t, points: newTotalScore } : t));
                setPointsInput("");
            } else {
                alert(data.msg || "Update failed");
            }
        } catch (err) {
            alert("Error connecting to server");
        }
    };

    const updateTeamLocally = (id, updates) => {
        setTeams(teams.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("adminToken");

        // Prepare data: ensures correctAnswer is in options for backend validation
        let finalOptions = [...qForm.options];
        if (qForm.qType === "TEXT") {
            finalOptions = [qForm.correctAnswer];
        } else {
            // Check if correct answer matches one of the options
            if (!finalOptions.map(o => o.trim()).includes(qForm.correctAnswer.trim())) {
                alert("For MCQs, the correct answer must exactly match one of the four options.");
                return;
            }
        }

        const payload = { ...qForm, options: finalOptions };
        const method = editingQuestionId ? "PUT" : "POST";
        const url = editingQuestionId
            ? `${ADMIN_API}/round1/questions/${editingQuestionId}`
            : `${ADMIN_API}/round1/questions`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                fetchRound1Questions();
                setIsQModalOpen(false);
                resetQForm();
            } else {
                const errorData = await res.json();
                alert(errorData.msg || "Operation failed");
            }
        } catch (err) {
            alert("Connection error: " + err.message);
        }
    };

    const resetQForm = () => {
        setQForm({
            seaNumber: 1,
            qType: "MCQ",
            questionText: "",
            imageUrl: "",
            options: ["", "", "", ""],
            correctAnswer: "",
            timeLimitSec: 60
        });
        setEditingQuestionId(null);
    };

    const handleEditQuestion = (q) => {
        setEditingQuestionId(q._id);
        setQForm({
            seaNumber: q.seaNumber,
            qType: q.qType,
            questionText: q.questionText,
            imageUrl: q.imageUrl || "",
            options: q.options || ["", "", "", ""],
            correctAnswer: q.correctAnswer,
            timeLimitSec: q.timeLimitSec
        });
        setIsQModalOpen(true);
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        const token = localStorage.getItem("adminToken");
        try {
            const res = await fetch(`${ADMIN_API}/round1/questions/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRound1Questions();
            } else {
                alert("Delete failed");
            }
        } catch (err) {
            alert("Connection error");
        }
    };

    // Round 2 Handlers
    const handleR2QuestionSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("adminToken");
        const method = editingR2Id ? "PUT" : "POST";
        const url = editingR2Id 
            ? `${API_BASE}/round2/questions/${editingR2Id}` 
            : `${API_BASE}/round2/questions`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(r2Form)
            });
            if (res.ok) {
                fetchRound2Questions();
                setIsR2ModalOpen(false);
                resetR2Form();
            } else {
                const data = await res.json();
                alert(data.msg || "Operation failed");
            }
        } catch (err) {
            alert("Connection error");
        }
    };

    const resetR2Form = () => {
        setR2Form({
            title: "",
            description: "",
            allowedAlgorithms: [],
            timeLimitSec: 300,
            testCases: [{ input: "", output: "", isHidden: false }]
        });
        setEditingR2Id(null);
    };

    const handleEditR2Question = (q) => {
        setEditingR2Id(q._id);
        setR2Form({
            title: q.title,
            description: q.description,
            allowedAlgorithms: q.allowedAlgorithms || [],
            timeLimitSec: q.timeLimitSec,
            testCases: q.testCases || [{ input: "", output: "", isHidden: false }]
        });
        setIsR2ModalOpen(true);
    };

    const handleDeleteR2Question = async (id) => {
        if (!window.confirm("Delete this Round 2 question?")) return;
        const token = localStorage.getItem("adminToken");
        try {
            const res = await fetch(`${API_BASE}/round2/questions/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchRound2Questions();
        } catch (err) {
            alert("Delete failed");
        }
    };

    const addTestCase = () => {
        setR2Form({
            ...r2Form,
            testCases: [...r2Form.testCases, { input: "", output: "", isHidden: false }]
        });
    };

    const removeTestCase = (idx) => {
        const newTC = r2Form.testCases.filter((_, i) => i !== idx);
        setR2Form({ ...r2Form, testCases: newTC });
    };

    const handleTestCaseChange = (idx, field, value) => {
        const newTC = [...r2Form.testCases];
        newTC[idx][field] = value;
        setR2Form({ ...r2Form, testCases: newTC });
    };

    const toggleAlgoSelection = (algoId) => {
        const current = [...r2Form.allowedAlgorithms];
        if (current.includes(algoId)) {
            setR2Form({ ...r2Form, allowedAlgorithms: current.filter(id => id !== algoId) });
        } else {
            setR2Form({ ...r2Form, allowedAlgorithms: [...current, algoId] });
        }
    };

    const toggleCard = (teamId, field, card, limit) => {
        // Disabled for now as backend doesn't support
        alert("Algo/Action cards integration is not ready in backend yet.");
    };

    const sortedLeaderboard = Array.isArray(teams) ? [...teams].sort((a, b) => b.points - a.points) : [];
    const editingTeam = teams.find(t => t.id === editingTeamId);

    if (!isLoggedIn) {
        return (
            <div className="admin-login-overlay">
                <form className="admin-login-form" onSubmit={handleLogin}>
                    <h2>KRIYA<span>2026 Admin Portal</span></h2>
                    <p>Enter credentials to access operations control</p>
                    <input
                        type="text"
                        placeholder="Username"
                        value={loginData.username}
                        onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={loginData.password}
                        onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                        required
                    />
                    <button type="submit" disabled={authLoading}>
                        {authLoading ? "Authenticating..." : "Login to System"}
                    </button>
                    <p className="login-hint">Credentials required for security clearance.</p>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <h2>KRIYA<span>2026 Admin</span></h2>
                </div>
                <nav className="admin-nav">
                    <button className={activeTab === "teams" ? "active" : ""} onClick={() => setActiveTab("teams")}>Teams Control</button>
                    <button className={activeTab === "round1" ? "active" : ""} onClick={() => setActiveTab("round1")}>Round 1 Questions</button>
                    <button className={activeTab === "round2" ? "active" : ""} onClick={() => setActiveTab("round2")}>Round 2 Questions</button>
                    <button className={activeTab === "leaderboard" ? "active" : ""} onClick={() => setActiveTab("leaderboard")}>Leaderboard</button>
                </nav>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1>
                        {activeTab === "teams" && "Live Operations"}
                        {activeTab === "leaderboard" && "Current Rankings"}
                        {activeTab === "round1" && "Round 1 Question Bank"}
                        {activeTab === "round2" && "Round 2 Coding Problems"}
                    </h1>
                    <div className="admin-status">System Status: <span>Active</span></div>
                </header>

                <div className="admin-content-area">
                    {activeTab === "teams" && (
                        <div className="teams-management-view">
                            <div className="search-bar-container">
                                <input
                                    type="text"
                                    placeholder="Search teams by name..."
                                    className="admin-search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="search-icon">🔍</div>
                            </div>
                            <div className="teams-wide-list">
                                {teams.filter(team => team.name.toLowerCase().includes(searchTerm.toLowerCase())).map(team => (
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

                    {activeTab === "round1" && (
                        <div className="round-questions-view">
                            <div className="view-header-row">
                                <button className="add-question-btn" onClick={() => {
                                    setEditingQuestionId(null);
                                    setQForm({
                                        seaNumber: 1,
                                        qType: "MCQ",
                                        questionText: "",
                                        imageUrl: "",
                                        options: ["", "", "", ""],
                                        correctAnswer: "",
                                        timeLimitSec: 60
                                    });
                                    setIsQModalOpen(true);
                                }}>
                                    + Add Question
                                </button>
                            </div>
                            <div className="questions-grid">
                                {round1Questions.map(q => (
                                    <div key={q._id} className="question-card">
                                        <div className="q-card-header">
                                            <span className="sea-badge">Sea {q.seaNumber}</span>
                                            <span className="type-badge">{q.qType}</span>
                                        </div>
                                        <p className="q-text">{q.questionText}</p>
                                        <div className="q-card-footer">
                                            <div className="q-stats">
                                                <span>⏳ {q.timeLimitSec}s</span>
                                                <span>🎯 {q.correctAnswer}</span>
                                            </div>
                                            <div className="q-actions">
                                                <button className="edit-q-btn" onClick={() => handleEditQuestion(q)}>Edit</button>
                                                <button className="delete-q-btn" onClick={() => handleDeleteQuestion(q._id)}>Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "round2" && (
                        <div className="round-questions-view">
                            <div className="view-header-row">
                                <button className="add-question-btn" onClick={() => {
                                    resetR2Form();
                                    setIsR2ModalOpen(true);
                                }}>
                                    + Add Coding Problem
                                </button>
                            </div>
                            <div className="questions-grid">
                                {round2Questions.map(q => (
                                    <div key={q._id} className="question-card">
                                        <div className="q-card-header">
                                            <span className="type-badge">Coding</span>
                                            <span className="sea-badge">{q.timeLimitSec}s</span>
                                        </div>
                                        <h3 className="q-title">{q.title}</h3>
                                        <p className="q-text">{q.description?.substring(0, 100)}...</p>
                                        <div className="q-card-footer">
                                            <div className="q-stats">
                                                <span>🧪 {q.testCases?.length} Tests</span>
                                                <span>📜 {q.allowedAlgorithms?.length} Scrolls</span>
                                            </div>
                                            <div className="q-actions">
                                                <button className="edit-q-btn" onClick={() => handleEditR2Question(q)}>Edit</button>
                                                <button className="delete-q-btn" onClick={() => handleDeleteR2Question(q._id)}>Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                            onChange={e => updateTeamLocally(editingTeam.id, { currentQuestionNo: parseInt(e.target.value) || 1 })}
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

            {/* Question Modal */}
            {isQModalOpen && (
                <div className="modal-overlay" onClick={() => setIsQModalOpen(false)}>
                    <div className="neat-modal" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>{editingQuestionId ? "Update" : "Add"} Round 1 Question</h2>
                                <p style={{ color: '#8b949e', fontSize: '0.8rem' }}>Set question details and oceanic placement</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setIsQModalOpen(false)}>&times;</button>
                        </header>
                        <form className="modal-sections" onSubmit={handleQuestionSubmit}>
                            <div className="modal-section scrollable">
                                <div className="input-group-grid">
                                    <div className="input-col">
                                        <label>Sea Number (1-4)</label>
                                        <input
                                            type="number"
                                            value={qForm.seaNumber}
                                            onChange={e => setQForm({ ...qForm, seaNumber: parseInt(e.target.value) })}
                                            min="1" max="4" required
                                        />
                                    </div>
                                    <div className="input-col">
                                        <label>Question Type</label>
                                        <select value={qForm.qType} onChange={e => setQForm({ ...qForm, qType: e.target.value })}>
                                            <option value="MCQ">MCQ</option>
                                            <option value="TEXT">Short Answer</option>
                                        </select>
                                    </div>
                                    <div className="input-col">
                                        <label>Time Limit (Sec)</label>
                                        <input
                                            type="number"
                                            value={qForm.timeLimitSec}
                                            onChange={e => setQForm({ ...qForm, timeLimitSec: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="control-box full-width">
                                    <label>Question Text</label>
                                    <textarea
                                        value={qForm.questionText}
                                        onChange={e => setQForm({ ...qForm, questionText: e.target.value })}
                                        rows="3" required
                                    />
                                </div>

                                <div className="control-box full-width">
                                    <label>Image URL (Optional)</label>
                                    <input
                                        type="text"
                                        value={qForm.imageUrl}
                                        onChange={e => setQForm({ ...qForm, imageUrl: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="options-section">
                                    <label>Options (For MCQ)</label>
                                    <div className="options-grid">
                                        {qForm.options.map((opt, idx) => (
                                            <input
                                                key={idx}
                                                type="text"
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...qForm.options];
                                                    newOpts[idx] = e.target.value;
                                                    setQForm({ ...qForm, options: newOpts });
                                                }}
                                                placeholder={`Option ${idx + 1}`}
                                                required={qForm.qType === "MCQ"}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="control-box full-width">
                                    <label>Correct Answer</label>
                                    <input
                                        type="text"
                                        value={qForm.correctAnswer}
                                        onChange={e => setQForm({ ...qForm, correctAnswer: e.target.value })}
                                        placeholder="Must match one of the options for MCQ"
                                        required
                                    />
                                </div>
                            </div>
                            <footer className="modal-footer">
                                <button type="button" className="cancel-footer-btn" onClick={() => setIsQModalOpen(false)}>Cancel</button>
                                <button type="submit" className="done-btn">
                                    {editingQuestionId ? "Update Question" : "Create Question"}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {/* Round 2 Modal */}
            {isR2ModalOpen && (
                <div className="modal-overlay" onClick={() => setIsR2ModalOpen(false)}>
                    <div className="neat-modal r2-modal" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <div>
                                <h2>{editingR2Id ? "Edit" : "Add"} Round 2 Coding Problem</h2>
                                <p style={{ color: '#8b949e', fontSize: '0.8rem' }}>Set problem statement, test cases, and allowed algorithms</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setIsR2ModalOpen(false)}>&times;</button>
                        </header>
                        <form className="modal-sections" onSubmit={handleR2QuestionSubmit}>
                            <div className="modal-section scrollable">
                                <div className="control-box full-width">
                                    <label>Title</label>
                                    <input 
                                        type="text" 
                                        value={r2Form.title} 
                                        onChange={e => setR2Form({...r2Form, title: e.target.value})} 
                                        required 
                                    />
                                </div>
                                <div className="control-box full-width">
                                    <label>Description</label>
                                    <textarea 
                                        value={r2Form.description} 
                                        onChange={e => setR2Form({...r2Form, description: e.target.value})} 
                                        rows="5" 
                                        required 
                                    />
                                </div>
                                <div className="input-group-grid">
                                    <div className="input-col">
                                        <label>Time Limit (Sec)</label>
                                        <input 
                                            type="number" 
                                            value={r2Form.timeLimitSec} 
                                            onChange={e => setR2Form({...r2Form, timeLimitSec: parseInt(e.target.value)})} 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <h3>Allowed Algorithms (Scrolls)</h3>
                                    <div className="card-pill-grid">
                                        {algorithmCards.map(algo => (
                                            <button
                                                key={algo._id}
                                                type="button"
                                                className={`action-pill algo ${r2Form.allowedAlgorithms.includes(algo._id) ? 'active' : ''}`}
                                                onClick={() => toggleAlgoSelection(algo._id)}
                                            >
                                                {algo.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-section">
                                    <div className="section-header-row">
                                        <h3>Test Cases</h3>
                                        <button type="button" className="add-tc-btn" onClick={addTestCase}>+ Add Case</button>
                                    </div>
                                    <div className="test-cases-list">
                                        {r2Form.testCases.map((tc, idx) => (
                                            <div key={idx} className="tc-item">
                                                <div className="tc-header">
                                                    <span>Case #{idx + 1}</span>
                                                    <button type="button" onClick={() => removeTestCase(idx)}>&times;</button>
                                                </div>
                                                <div className="tc-inputs">
                                                    <textarea 
                                                        placeholder="Input" 
                                                        value={tc.input} 
                                                        onChange={e => handleTestCaseChange(idx, "input", e.target.value)} 
                                                    />
                                                    <textarea 
                                                        placeholder="Expected Output" 
                                                        value={tc.output} 
                                                        onChange={e => handleTestCaseChange(idx, "output", e.target.value)} 
                                                    />
                                                </div>
                                                <label className="hidden-check">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={tc.isHidden} 
                                                        onChange={e => handleTestCaseChange(idx, "isHidden", e.target.checked)} 
                                                    />
                                                    Hidden Test Case
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <footer className="modal-footer">
                                <button type="button" className="cancel-footer-btn" onClick={() => setIsR2ModalOpen(false)}>Cancel</button>
                                <button type="submit" className="done-btn">Save Problem</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
