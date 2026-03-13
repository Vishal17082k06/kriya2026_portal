import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useLocation } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";

import { submitToJudge } from "./utils/judge0";
import { API_BASE } from "./config/api";
import "./PirateArena.css";

/* ================================================================
   1. PROBLEM DATA
   ================================================================ */
const PROBLEMS = [
  {
    id: 1,
    slug: "two-sum",
    title: "Two Sum — The Treasure Coordinates",
    lore: "The treasure chest awaits at the intersection of two coordinates...",
    description: `
      <p>Given an array of integers <strong>nums</strong> and an integer <strong>target</strong>,
      return the <em>indices</em> of the two numbers such that they add up to target.</p>
      <p>You may assume each input has <strong>exactly one solution</strong>, and you may not
      use the same element twice. Return the answer in any order, <em>ye scallywag</em>.</p>`,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0, 1]",
        explanation: "nums[0] + nums[1] = 9.",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1, 2]",
        explanation: null,
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0, 1]",
        explanation: null,
      },
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "-10⁹ ≤ target ≤ 10⁹",
      "Only one valid answer exists.",
    ],
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
      { input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expected: [2, 4] },
      {
        input: { nums: [1000000000, 999999999], target: 1999999999 },
        expected: [0, 1],
      },
    ],
    bountyReward: 150,
  },
  {
    id: 2,
    slug: "valid-parentheses",
    title: "Valid Parentheses — The Kraken's Maw",
    lore: "The Kraken's jaws open and close with perfect symmetry. Mimic its pattern...",
    description: `
      <p>Given a string <strong>s</strong> containing just the characters
      <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>,
      <code>'['</code> and <code>']'</code>, determine if the input string is <strong>valid</strong>.</p>
      <ol>
        <li>Open brackets must be closed by the <em>same type</em> of brackets.</li>
        <li>Open brackets must be closed in the <em>correct order</em>.</li>
        <li>Every close bracket has a corresponding open bracket of the same type.</li>
      </ol>`,
    examples: [
      { input: 's = "()"', output: "true", explanation: null },
      { input: 's = "()[]{}"', output: "true", explanation: null },
      { input: 's = "(]"', output: "false", explanation: null },
      { input: 's = "{[]}"', output: "true", explanation: null },
    ],
    constraints: [
      "1 ≤ s.length ≤ 10⁴",
      "s consists of parentheses only '()[]{}'",
    ],
    testCases: [
      { input: { s: "()" }, expected: true },
      { input: { s: "()[]{}" }, expected: true },
      { input: { s: "(]" }, expected: false },
      { input: { s: "([)]" }, expected: false },
      { input: { s: "{[]}" }, expected: true },
    ],
    bountyReward: 150,
  },
  {
    id: 3,
    slug: "longest-common-prefix",
    title: "Longest Common Prefix — Pirate's Codex",
    lore: "All charts share the same starting legend. Find it before the storm hits...",
    description: `
      <p>Write a function to find the <strong>longest common prefix</strong> string
      amongst an array of strings.</p>
      <p>If there is no common prefix, return an empty string <code>""</code>.</p>`,
    examples: [
      {
        input: 'strs = ["flower","flow","flight"]',
        output: '"fl"',
        explanation: null,
      },
      {
        input: 'strs = ["dog","racecar","car"]',
        output: '""',
        explanation: "No common prefix.",
      },
    ],
    constraints: [
      "1 ≤ strs.length ≤ 200",
      "0 ≤ strs[i].length ≤ 200",
      "strs[i] consists of lowercase English letters.",
    ],
    testCases: [
      { input: { strs: ["flower", "flow", "flight"] }, expected: "fl" },
      { input: { strs: ["dog", "racecar", "car"] }, expected: "" },
      { input: { strs: ["a"] }, expected: "a" },
    ],
    bountyReward: 250,
  },
];

/* ================================================================
   2. JUDGE0 UTILITY — Real Judge0 integration
   ================================================================ */

const JUDGE0_URL = "https://appghcc.psgtech.ac.in";
const JUDGE0_LANGUAGE_IDS = { python: 71, c: 75, java: 62 };


/**
 * Run code against a single sample input via Judge0 directly.
 * Used by the "Run" button for quick feedback.
 */
async function runCode(code, language, problem) {
  if (!code || code.trim().length < 5)
    return { status: "error", output: "Error: No code to run, ye landlubber!" };

  const langId = JUDGE0_LANGUAGE_IDS[language];
  if (!langId) return { status: "error", output: `Unsupported language: ${language}` };

  // Use first test case input as the sample stdin
  const sampleInput = problem.testCases?.[0]?.input ?? problem.examples?.[0]?.input ?? "";

  try {
    const res = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_id: langId,
          source_code: code,
          stdin: sampleInput,
        }),
      }
    );
    if (!res.ok) throw new Error(`Judge0 responded with ${res.status}`);
    const result = await res.json();

    if (result.status?.id === 6) {
      return {
        status: "error",
        output: `Compilation Error:\n${result.compile_output || result.stderr || "(no details)"}`,
      };
    }
    const stdout = (result.stdout || "").trim() || "(no output)";
    return {
      status: "success",
      output: `Output:\n${stdout}\nStatus: ${result.status?.description}  ·  Time: ${result.time ?? "?"}s`,
    };
  } catch (e) {
    return { status: "error", output: `Judge0 error: ${e.message}` };
  }
}

/* ================================================================
   3. MONACO THEME — "High Seas v2"
   ================================================================ */
const HIGH_SEAS_THEME = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "3d6878", fontStyle: "italic" },
    { token: "keyword", foreground: "c8912a", fontStyle: "bold" },
    { token: "string", foreground: "5ecba1" },
    { token: "number", foreground: "e07a5f" },
    { token: "type", foreground: "7db8d8" },
    { token: "function", foreground: "f0b93a" },
    { token: "variable", foreground: "b8d4e0" },
    { token: "operator", foreground: "c8912a" },
    { token: "delimiter", foreground: "5a8fa8" },
    { token: "identifier", foreground: "a8c8d8" },
    { token: "class", foreground: "e6c87a", fontStyle: "bold" },
  ],
  colors: {
    "editor.background": "#040a0e",
    "editor.foreground": "#b8d4e0",
    "editor.lineHighlightBackground": "#0c2030aa",
    "editor.lineHighlightBorder": "#1a4060",
    "editor.selectionBackground": "#c8912a28",
    "editor.selectionHighlightBackground": "#c8912a14",
    "editorCursor.foreground": "#f0b93a",
    "editorLineNumber.foreground": "#2a5068",
    "editorLineNumber.activeForeground": "#c8912a",
    "editorGutter.background": "#030810",
    "editorIndentGuide.background1": "#0f2535",
    "editorIndentGuide.activeBackground1": "#c8912a44",
    "editorWidget.background": "#071525",
    "editorWidget.border": "#c8912a33",
    "editorSuggestWidget.background": "#071525",
    "editorSuggestWidget.border": "#c8912a44",
    "editorSuggestWidget.selectedBackground": "#c8912a22",
    "editorBracketMatch.background": "#c8912a22",
    "editorBracketMatch.border": "#c8912a",
    "scrollbarSlider.background": "#3d251088",
    "scrollbarSlider.hoverBackground": "#7a4a22aa",
    "scrollbarSlider.activeBackground": "#c8912a99",
    "minimap.background": "#030810",
    focusBorder: "#c8912a",
  },
};

/* ================================================================
   4. SUB-COMPONENTS (all inline)
   ================================================================ */

/* ── 4a. Header ─────────────────────────────────────────────────── */
function Header({ lives, bounty, spinning, maxLives, shatterIdx }) {
  return (
    <header className="pa-header">
      {/* Lives */}
      <div className="pa-lives" role="group" aria-label="Lives remaining">
        <span className="pa-lives-label">Lives</span>
        {Array.from({ length: maxLives }).map((_, i) => {
          const alive = i < lives;
          const shattering = i === shatterIdx;
          return (
            <span
              key={i}
              className={`pa-skull ${alive ? "alive" : "lost"}${shattering ? " shattering" : ""}`}
              role="img"
              aria-label={alive ? "Life" : "Lost life"}
              title={alive ? "Life remaining" : "Life lost"}
            >
              ☠
            </span>
          );
        })}
      </div>

      {/* Title */}
      <h1 className="pa-header-title">⚓ &nbsp;Code Harbour</h1>

      {/* Bounty */}
      <div className="pa-bounty" aria-label={`Bounty: ${bounty} points`}>
        <div className="pa-bounty-inner">
          <span className="pa-coin" aria-hidden="true">
            🪙
          </span>
          <span className={`pa-bounty-value${spinning ? " spinning" : ""}`}>
            {bounty.toLocaleString()}
          </span>
          <span className="pa-bounty-label">pts</span>
        </div>
      </div>
    </header>
  );
}

/* ── 4b. Problem Panel ──────────────────────────────────────────── */
function ProblemPanel({ problem, onBack }) {
  const [tab, setTab] = useState("description");

  return (
    <aside className="pa-parchment" aria-label="Problem description">
      {/* Back Navigation */}
      <button
        className="pa-btn-back"
        onClick={onBack}
        aria-label="Return to Island Map"
      >
        <span>⬅</span> Back
      </button>

      {/* Tabs */}
      <div className="pa-tabs" role="tablist">
        {[
          ["description", "📜 Lore"],
          ["examples", "🗺 Examples"],
          ["constraints", "⚓ Rules"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`pa-tab${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Title */}
      <h2 className="pa-problem-title">
        #{problem.id}. {problem.title}
      </h2>

      {/* Meta */}
      <div className="pa-problem-meta">
        <span>🏴‍☠️ {problem.bountyReward} pts</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>{problem.testCases.length} tests</span>
      </div>

      {/* Description */}
      {tab === "description" && (
        <div className="pa-body" role="tabpanel">
          {problem.lore && <p className="pa-lore-quote">"{problem.lore}"</p>}
          <div dangerouslySetInnerHTML={{ __html: problem.description }} />
        </div>
      )}

      {tab === "examples" && (
        <div role="tabpanel" style={{ paddingTop: "0.2rem" }}>
          <p className="pa-section-label">📖 Examples</p>
          {problem.examples.map((ex, i) => (
            <div key={i} className="pa-example-card">
              {/* Card header */}
              <div className="pa-example-header">
                <span className="pa-example-num">Example {i + 1}</span>
              </div>
              {/* Input | Output side by side */}
              <div className="pa-example-body">
                <div className="pa-example-cell">
                  <span className="pa-example-cell-label">⬇ Input</span>
                  <code>{ex.input}</code>
                </div>
                <div className="pa-example-cell">
                  <span className="pa-example-cell-label">⬆ Output</span>
                  <code>{ex.output}</code>
                </div>
              </div>
              {/* Explanation footer */}
              {ex.explanation && (
                <div className="pa-example-note">💬 {ex.explanation}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Constraints */}
      {tab === "constraints" && (
        <div className="pa-body" role="tabpanel">
          <p className="pa-section-label">📏 Constraints</p>
          <ul className="pa-constraint-list">
            {problem.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <div className="pa-divider" style={{ margin: "1.1rem 0 0.65rem" }}>
            Hint
          </div>
          <div className="pa-hint">
            🔮{" "}
            <em>
              Ask yerself: can ye trade space for time? A hash map might chart
              yer course true…
            </em>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ── 4c. Monaco Code Editor ─────────────────────────────────────── */
const CodeEditor = forwardRef(function CodeEditor(
  { code, onChange, language, shipwrecked },
  ref,
) {
  const editorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
    layout: () => editorRef.current?.layout(),
  }));

  function onMount(editor, monaco) {
    editorRef.current = editor;
    monaco.editor.defineTheme("high-seas-v2", HIGH_SEAS_THEME);
    monaco.editor.setTheme("high-seas-v2");
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 13.5,
      fontFamily: '"JetBrains Mono","Fira Code","Courier Prime",monospace',
      fontLigatures: true,
      lineHeight: 23,
      padding: { top: 18, bottom: 18 },
      scrollBeyondLastLine: false,
      renderLineHighlight: "all",
      cursorStyle: "line",
      lineNumbers: "on",
      tabSize: 4,
      automaticLayout: true,
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      overviewRulerBorder: false,
      scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
    });
  }

  const LANG_MAP = {
    python: "python",
    c: "c",
    cpp: "cpp",
    java: "java",
  };

  return (
    <div
      className={`pa-editor-zone${shipwrecked ? " shipwrecked" : ""}`}
      aria-label="Code editor"
    >
      <MonacoEditor
        height="100%"
        language={LANG_MAP[language] ?? "javascript"}
        value={code}
        onChange={(val) => onChange(val ?? "")}
        onMount={onMount}
        theme="high-seas-v2"
        loading={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "0.6rem",
              fontFamily: "'Pirata One',cursive",
              fontSize: "1rem",
              color: "#c8912a",
              background: "#040a0e",
            }}
          >
            <span style={{ animation: "pa-float 1.2s ease-in-out infinite" }}>
              ⚓
            </span>
            Rigging the Editor…
          </div>
        }
        options={{
          theme: "high-seas-v2",
          minimap: { enabled: false },
          cursorStyle: "line",
          lineNumbers: "on",
        }}
      />
    </div>
  );
});

/* ── 4d. Lower Deck / Terminal ──────────────────────────────────── */
function LowerDeck({ logs, loading, collapsed, onToggle }) {
  const termRef = useRef(null);

  useEffect(() => {
    if (termRef.current)
      termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [logs, loading]);

  const icon = (t) =>
    ({ pass: "✓", fail: "✗", error: "☠", system: "⚓", info: "◈", warn: "⚠" })[
    t
    ] ?? "›";
  const prefix = (t) =>
    ({
      pass: "[PASS]",
      fail: "[FAIL]",
      error: "[ERR] ",
      system: "[SYS] ",
      info: "[INFO]",
      warn: "[WARN]",
    })[t] ?? "[LOG] ";

  return (
    <section
      className={`pa-deck${collapsed ? " pa-deck--collapsed" : ""}`}
      aria-label="Captain's Log"
    >
      <div className="pa-deck-header">
        <div className="pa-deck-title">
          <span aria-hidden="true">📜</span> Captain's Log
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {!collapsed && loading && (
            <span className="pa-deck-loading">⚡ Consulting Davy Jones…</span>
          )}
          {!collapsed && (
            <span className="pa-deck-meta">{logs.length} entries</span>
          )}
          <button
            className="pa-deck-toggle"
            onClick={onToggle}
            aria-label={
              collapsed ? "Expand Captain's Log" : "Collapse Captain's Log"
            }
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          className="pa-terminal"
          ref={termRef}
          role="log"
          aria-live="polite"
        >
          {logs.length === 0 && !loading ? (
            <div className="pa-terminal-empty" aria-hidden="true">
              <span style={{ fontSize: "2rem", opacity: 0.35 }}>🌊</span>
              <span>Calm seas… submit yer code, Captain.</span>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={log.id ?? i} className={`pa-log ${log.type}`}>
                <span className="pa-log-pre" aria-hidden="true">
                  {log.icon ?? icon(log.type)}&nbsp;{prefix(log.type)}
                </span>
                <span className="pa-log-txt">{log.text}</span>
              </div>
            ))
          )}
          {loading && (
            <div className="pa-log info">
              <span className="pa-log-pre" aria-hidden="true">
                ◈ [INFO]
              </span>
              <span className="pa-log-txt">
                <span className="pa-cursor" aria-hidden="true" />
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ── 4e. Game Over Overlay ──────────────────────────────────────── */
function GameOverOverlay({ onRestart }) {
  return (
    <div
      className="pa-gameover"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pa-go-title"
      aria-describedby="pa-go-desc"
    >
      <div className="pa-gameover-skulls" aria-hidden="true">
        ☠ ☠ ☠
      </div>
      <h2 id="pa-go-title" className="pa-gameover-title">
        ⚓ Shipwrecked! ⚓
      </h2>
      <p id="pa-go-desc" className="pa-gameover-sub">
        Ye've run out of lives, ye scurvy sailor.
        <br />
        The Kraken claims yer code — start anew, brave pirate.
      </p>
      <div className="pa-gameover-rule" aria-hidden="true" />
      <button
        id="pa-restart-btn"
        className="pa-btn-restart"
        onClick={onRestart}
        autoFocus
      >
        🏴‍☠️ &nbsp; Sail Again, Captain!
      </button>
      <p className="pa-gameover-epigraph">
        "A smooth sea never made a skilled pirate."
      </p>
    </div>
  );
}

/* ================================================================
   5. MAIN COMPONENT
   ================================================================ */
let LOG_ID = 0;

export default function PirateArena({ problemId = 1, onBack }) {
  const location = useLocation();
  const stateProblem = location.state?.problem;

  // Adapt DB problem to Arena format
  const mappedProblem = stateProblem ? {
    id: stateProblem._id,
    slug: stateProblem.title.toLowerCase().replace(/\s+/g, '-'),
    title: stateProblem.title,
    lore: "A challenge from the deep...",
    description: stateProblem.description,
    examples: (stateProblem.testCases || [])
      .filter(tc => !tc.isHidden)
      .map(tc => ({
        input: tc.input || "",
        output: tc.output || "",
        explanation: null
      })),
    constraints: [`Time Limit: ${stateProblem.timeLimitSec}s`],
    testCases: (stateProblem.testCases || []).map(tc => ({
      input: tc.input,
      expected: tc.output
    })),
    bountyReward: 150
  } : null;

  const initialProblem =
    mappedProblem || PROBLEMS.find((p) => p.id === problemId) || PROBLEMS[0];
  const [problem] = useState(initialProblem);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");

  const [maxLives, setMaxLives] = useState(3);
  const [lives, setLives] = useState(3);
  const [bounty, setBounty] = useState(0);

  useEffect(() => {
    async function fetchLives() {
      const storedTeam = JSON.parse(localStorage.getItem("team") || "{}");
      const teamId = storedTeam.id || storedTeam._id || storedTeam.kriyaID || storedTeam.kriyaId || storedTeam.kriyaid;
      const token = localStorage.getItem("token");
      if (!teamId || !token) return;

      try {
        const res = await fetch(`${API_BASE}/api/teams/profile/${teamId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.round2 && data.round2.problemsStatus) {
            const thisProblemId = problem?.id || problem?._id;
            const pStatus = data.round2.problemsStatus.find(p => p.problemId === thisProblemId || (p.problemId && p.problemId._id === thisProblemId));
            if (pStatus) {
              const currentLives = Math.max(0, pStatus.livesLeft + (pStatus.bonusLives || 0));
              setLives(currentLives);
              setMaxLives(Math.max(currentLives, 3));
            }
          }
        }
      } catch (e) {
        console.error("Error fetching lives", e);
      }
    }
    fetchLives();
  }, [problem]);
  const [gameOver, setGameOver] = useState(false);
  const [solved, setSolved] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [shipwrecked, setShipwrecked] = useState(false);
  const [shatterIdx, setShatterIdx] = useState(-1);
  const [termCollapsed, setTermCollapsed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const editorRef = useRef(null);

  const addLog = useCallback(
    (type, text, icon) =>
      setLogs((prev) => [...prev, { id: ++LOG_ID, type, text, icon }]),
    [],
  );
  const clearLogs = useCallback(() => setLogs([]), []);

  const handleBack = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      if (onBack) onBack();
      else window.history.back(); // Fallback if no onBack is provided
    }, 250); // Matches the pa-arena-exit duration
  }, [onBack]);

  /* Language change */
  const handleLang = useCallback(
    (lang) => {
      if (loading) return;
      setLanguage(lang);
      setCode("");
      clearLogs();
      addLog("system", `Switched to ${lang.toUpperCase()} — editor cleared.`);
    },
    [loading, clearLogs, addLog],
  );

  /* Run */
  const handleRun = useCallback(async () => {
    if (loading || gameOver) return;
    setLoading(true);
    clearLogs();
    addLog("system", `▶ Running ${language.toUpperCase()} on sample input…`);
    try {
      const r = await runCode(code, language, problem);
      if (r.status === "success")
        r.output.split("\n").forEach((l) => addLog("info", l));
      else addLog("error", r.output);
    } catch (e) {
      addLog("error", `Runtime error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [loading, gameOver, code, language, problem, clearLogs, addLog]);

  /* Submit — calls backend which runs Judge0 and saves to DB */
  const handleSubmit = useCallback(async () => {
    if (loading || gameOver) return;
    setLoading(true);
    clearLogs();
    addLog(
      "system",
      `🏴‍☠️ Submitting yer ${language.toUpperCase()} code to Davy Jones…`,
    );

    // Resolve team info from localStorage (set on login)
    let storedTeam = {};
    const rawTeam = localStorage.getItem("team");
    if (rawTeam) {
      try {
        storedTeam = JSON.parse(rawTeam);
      } catch {
        // Some flows might store just a plain string ID.
        storedTeam = { teamId: rawTeam, id: rawTeam };
      }
    }

    const teamId =
      storedTeam?.teamId ||
      storedTeam?.teamID ||
      storedTeam?.id ||
      storedTeam?._id ||
      storedTeam?.kriyaID ||
      storedTeam?.kriyaId ||
      storedTeam?.kriyaid;
    const kriyaID =
      storedTeam?.kriyaID ||
      storedTeam?.kriyaId ||
      storedTeam?.kriyaid ||
      storedTeam?.id ||
      storedTeam?._id;
    const token = localStorage.getItem("token");

    const problemId = problem?.id || problem?._id;

    if (!teamId || !problemId) {
      addLog(
        "error",
        "⚠️ Could not resolve teamId or problemId. Are ye logged in?",
      );
      addLog(
        "error",
        `Stored team: ${JSON.stringify(storedTeam)} (token present: ${Boolean(token)})`,
      );
      setLoading(false);
      return;
    }

    let submission;
    try {
      submission = await submitToJudge(code, language, problem, {
        teamId,
        kriyaID,
        token,
      });
    } catch (e) {
      addLog("error", `⚠️ Fatal error: ${e.message}`);
      setLoading(false);
      return;
    }

    const {
      verdict,
      passedTestCases,
      totalTestCases,
      livesLeft,
      sunk,
      compilationError,
      score,
      message,
      effectApplied,
    } = submission;

    if (effectApplied) addLog("system", `⚡ ${effectApplied}`);
    if (message) addLog("info", message);

    if (verdict === "ACCEPTED") {
      addLog(
        "pass",
        `⚓ ACCEPTED — All ${totalTestCases}/${totalTestCases} test cases passed! Hoist the colours!`,
      );
      addLog(
        "info",
        `💰 +${score ?? problem.bountyReward} doubloons added to yer bounty!`,
      );
      if (!solved.has(problem.id)) {
        setBounty((b) => b + (score ?? problem.bountyReward));
        setSolved((prev) => new Set([...prev, problem.id]));
        setSpinning(true);
        setTimeout(() => setSpinning(false), 700);
      } else {
        addLog("info", "Already solved — no extra doubloons this run.");
      }
    } else {
      // WRONG_ANSWER or COMPILATION_ERROR — deduct a life
      if (verdict === "COMPILATION_ERROR") {
        addLog("error", `🔥 COMPILATION ERROR — Fix yer syntax, Captain!`);
        compilationError
          ?.split("\n")
          .slice(0, 8)
          .forEach((l) => addLog("error", l));
      } else {
        addLog(
          "fail",
          `💀 WRONG ANSWER — ${passedTestCases}/${totalTestCases} test cases passed. The ship be takin' on water!`,
        );

        // Show details of the first failing test case if available
        if (submission.testResults) {
          const failedCase = submission.testResults.find((r) => !r.passed);
          if (failedCase) {
            const idx = submission.testResults.indexOf(failedCase);
            addLog("warn", `◈ Failed at Test Case #${idx + 1}:`);
            addLog("info", `  › Input: ${failedCase.input}`);
            addLog("info", `  › Expected: ${failedCase.expectedOutput}`);
            addLog("info", `  › Actual: ${failedCase.actualOutput || '(no output)'}`);
            if (failedCase.stderr) {
              const errLines = failedCase.stderr.split('\\n').filter(l => l.trim()).slice(0, 3);
              if (errLines.length) {
                addLog("error", `  › Error Output:`);
                errLines.forEach(line => addLog("error", `    ${line}`));
              }
            }
            if (failedCase.status && failedCase.status !== "Wrong Answer") {
              addLog("info", `  › Status: ${failedCase.status}`);
            }
          }
        }
      }

      // Sync lives with backend if provided, else decrement locally
      const nextLives = livesLeft ?? Math.max(0, lives - 1);
      setShatterIdx(nextLives); // shatter the skull at the new boundary
      setTimeout(() => setShatterIdx(-1), 750);

      if (sunk || nextLives <= 0) {
        addLog("error", "☠️ SHIPWRECKED! The Kraken claims yer vessel!");
        if (sunk) addLog("info", "Lives reset — ye may retry once the waters calm.");
        setShipwrecked(true);
        setTimeout(() => {
          setCode("");
          setShipwrecked(false);
          setLives(0);
          setGameOver(true);
        }, 1500);
      } else {
        setLives(nextLives);
        addLog(
          "warn",
          `⚠️ ${nextLives} ${nextLives === 1 ? "life" : "lives"} remaining!`,
        );
      }
    }
    setLoading(false);
  }, [
    loading,
    gameOver,
    code,
    language,
    problem,
    lives,
    solved,
    clearLogs,
    addLog,
  ]);
  /* Restart */
  const handleRestart = useCallback(() => {
    setLives(maxLives);
    setBounty(0);
    setGameOver(false);
    setSolved(new Set());
    setShatterIdx(-1);
    setCode("");
    clearLogs();
    addLog("system", "⚓ A new voyage begins! Good luck, Captain.");
    setTimeout(() => editorRef.current?.focus(), 100);
  }, [clearLogs, addLog, maxLives]);

  /* Reset code */
  const handleReset = useCallback(() => {
    if (loading || gameOver) return;
    setCode("");
    addLog("system", "Code reset to empty.");
  }, [loading, gameOver, addLog]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        e.shiftKey ? handleRun() : handleSubmit();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleSubmit, handleRun]);

  /* Welcome */
  useEffect(() => {
    addLog(
      "system",
      "⚓ Welcome to the Pirate DSA Arena! Brace yerself, sailor.",
    );
    addLog("system", `Problem loaded: "${PROBLEMS[0].title}"`);
    addLog("info", "Tip: Ctrl+Enter → Submit  ·  Shift+Ctrl+Enter → Run");
  }, []); // eslint-disable-line

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className={`pirate-arena${isClosing ? " is-closing" : ""}`}>
      <Header
        lives={lives}
        bounty={bounty}
        shatterIdx={shatterIdx}
        spinning={spinning}
        maxLives={maxLives}
      />

      <div className="pa-split">
        {/* Left — Problem */}
        <ProblemPanel problem={problem} onBack={handleBack} />

        {/* Divider */}
        <div className="pa-divider-bar" aria-hidden="true" />

        {/* Right — Editor */}
        <section className="pa-editor-panel" aria-label="Code Editor Panel">
          {/* Toolbar */}
          <div className="pa-toolbar">
            {/* Left — status only */}
            <div className="pa-toolbar-left">
              <span
                className="pa-status-dot"
                aria-hidden="true"
                title="Editor ready"
              />
              {solved.has(problem.id) && (
                <span className="pa-solved-badge">✓ Plundered!</span>
              )}
            </div>

            {/* Right — language selector */}
            <select
              id="pa-lang-select"
              className="pa-lang-select"
              value={language}
              onChange={(e) => handleLang(e.target.value)}
              disabled={loading || gameOver}
              aria-label="Select programming language"
            >
              <option value="python">🧭 Python 3</option>
              <option value="c">🌊 C</option>
              <option value="cpp">🛡️ C++</option>
              <option value="java">🏴‍☠️ Java</option>
            </select>
          </div>

          {/* Action Bar */}
          <div className="pa-actions">
            {" "}
            <button
              id="pa-submit-btn"
              className="pa-btn pa-btn-submit"
              onClick={handleSubmit}
              disabled={loading || gameOver}
              title="Submit to all tests (Ctrl+Enter)"
            >
              {loading ? "⏳ Judging…" : "🏴‍☠️ Submit"}
            </button>
            <button
              id="pa-reset-btn"
              className="pa-btn pa-btn-reset"
              onClick={handleReset}
              disabled={loading || gameOver}
              title="Reset to starter template"
            >
              ↺ Reset
            </button>
            <span className="pa-kbd-hint">Ctrl+↵ Submit</span>
          </div>

          {/* Monaco */}
          <CodeEditor
            ref={editorRef}
            code={code}
            onChange={setCode}
            language={language}
            shipwrecked={shipwrecked}
          />

          {/* Terminal */}
          <LowerDeck
            logs={logs}
            loading={loading}
            collapsed={termCollapsed}
            onToggle={() => setTermCollapsed((v) => !v)}
          />

          {/* Game Over */}
          {gameOver && <GameOverOverlay onRestart={handleRestart} />}
        </section>
      </div>
    </div>
  );
}
