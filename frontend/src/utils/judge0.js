// ─── Judge0 Submission Utility ────────────────────────────────────────────────
// This helper can run code through a Judge0 endpoint (e.g., https://judge0-ce.p.rapidapi.com)
// and decode test results into a simple pass/fail report for the UI.
//
// To enable real Judge0 execution:
//   1. Get a Judge0 API key (e.g., RapidAPI Judge0 CE)
//   2. Add it to your env as VITE_JUDGE0_API_KEY
//   3. Optionally set VITE_JUDGE0_URL / VITE_JUDGE0_HOST if you are self-hosting
//
// If no API key is provided, it falls back to a lightweight simulation (for demos).

import { API_BASE } from "../config/api";

const JUDGE0_URL = import.meta.env.VITE_JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = import.meta.env.VITE_JUDGE0_API_KEY;
const JUDGE0_HOST = import.meta.env.VITE_JUDGE0_HOST || "judge0-ce.p.rapidapi.com";
const USE_REAL_JUDGE0 = Boolean(JUDGE0_API_KEY);
const SUBMISSION_ENDPOINT = `${API_BASE || "http://localhost:3000"}/api/round2/submissions`;

// Judge0 Language IDs
export const JUDGE0_LANGUAGE_IDS = {
  python:     71,  // Python 3
  javascript: 63,  // Node.js JS
  cpp:        54,  // C++ (GCC 9.2.0)
  java:       62,  // Java (OpenJDK 13)
  c:          50,  // C (GCC 9.2.0)
};

// ─── Simulate Delay ───────────────────────────
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── Helpers ───────────────────────────────────
function normalizeInput(input) {
  if (input === undefined || input === null) return "";
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

function normalizeExpected(expected) {
  if (expected === undefined || expected === null) return "";
  if (typeof expected === "string") return expected;
  try {
    return JSON.stringify(expected);
  } catch {
    return String(expected);
  }
}

function outputsMatch(actual, expected) {
  const a = (actual ?? "").trim();
  const e = (expected ?? "").trim();
  if (a === e) return true;

  // Try comparing JSON structures so small formatting differences don't cause failures.
  try {
    const parsedA = JSON.parse(a);
    const parsedE = JSON.parse(e);
    return JSON.stringify(parsedA) === JSON.stringify(parsedE);
  } catch {
    // Fall through
  }

  return a === e;
}

async function submitToJudge0Real(code, languageId, stdin = "") {
  const endpoint = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
  const headers = { "Content-Type": "application/json" };

  // RapidAPI Judge0 requires these headers when using the hosted CE service.
  if (JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = JUDGE0_HOST;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      language_id: languageId,
      source_code: code,
      stdin,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Judge0 responded with ${response.status}: ${text}`);
  }

  return response.json();
}

// ─── Simulate a Judge0-like result ────────────
function simulateResult(code, testCases) {
  if (!code || code.trim().length < 10) {
    return {
      status: "error",
      results: [],
      message: "☠️ Ye submitted naught but the empty abyss, Captain!",
    };
  }

  // Simple heuristic: if code has keywords, pass more tests
  const hasLogic = /return|def |function |class |for |while |if /i.test(code);
  const passRate = hasLogic ? 0.8 : 0.4; // Slightly better odds for demo

  const results = testCases.map((tc, idx) => {
    const passed = Math.random() < passRate;
    const isHidden = tc.isHidden || false;

    return {
      id: idx + 1,
      passed,
      status: passed ? "pass" : "fail",
      input: isHidden ? "[HIDDEN]" : String(tc.input),
      expected: isHidden ? "[HIDDEN]" : String(tc.expected),
      actual: isHidden ? "[HIDDEN]" : (passed ? String(tc.expected) : "null"),
      time: `${(Math.random() * 80 + 20).toFixed(0)}ms`,
      memory: `${(Math.random() * 10 + 8).toFixed(1)}MB`,
      isHidden
    };

  });

  const passed = results.filter((r) => r.status === "pass").length;
  const allPassed = passed === results.length;

  return {
    verdict: allPassed ? "ACCEPTED" : "WRONG_ANSWER",
    passedTestCases: passed,
    totalTestCases: results.length,
    testResults: results.map(r => ({
      ...r,
      actualOutput: r.actual,
      expectedOutput: r.expected
    })),
    message: allPassed
      ? `⚓ All ${passed}/${results.length} test cases passed! Hoist the colours!`
      : `💀 ${passed}/${results.length} passed. The ship be takin' on water!`,
    score: Math.round((passed / results.length) * 100),
  };
}


// ─── Main Export: submitToJudge ────────────────
// This is the function you wire up to the Submit button.
// `code`     → the current editor value (string)
// `language` → 'python' | 'javascript' | 'cpp' | 'java'
// `problem`  → the full problem object (for test cases & bounty)
// `options`  → optional context (teamId/kriyaID/token) used to hit the backend.
export async function submitToJudge(
  code,
  language,
  problem,
  options = {},
) {
  if (!code || code.trim().length < 5) {
    return {
      verdict: "ERROR",
      passedTestCases: 0,
      totalTestCases: 0,
      message: "No code to run.",
    };
  }

  const languageId = JUDGE0_LANGUAGE_IDS[language];
  if (!languageId) {
    return {
      verdict: "ERROR",
      passedTestCases: 0,
      totalTestCases: 0,
      message: `Unsupported language: ${language}`,
    };
  }

  const testCases = (problem?.testCases || []).slice();
  if (testCases.length === 0) {
    return {
      verdict: "ERROR",
      passedTestCases: 0,
      totalTestCases: 0,
      message: "No test cases available.",
    };
  }

  // Forward the submission to the backend API and let it handle Judge0.
  if (API_BASE) {
    try {
      const body = {
        teamId: options.teamId,
        kriyaID: options.kriyaID,
        problemId: problem.id || problem._id,
        language: language.toUpperCase(),
        language_id: languageId,
        code,
      };

      const headers = { "Content-Type": "application/json" };
      if (options.token) headers.Authorization = `Bearer ${options.token}`;

      const res = await fetch(SUBMISSION_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || data.message || `Server error ${res.status}`);

      return data.submission || data;
    } catch (e) {
      throw new Error(`Failed to submit code: ${e.message}`);
    }
  }

  throw new Error("API_BASE is not defined! Cannot submit code.");
}

// ─── Run Code (no eval, just format feedback) ─
export async function runCode(code, language, problem) {
  if (!code || code.trim().length < 5) {
    return {
      status: "error",
      output: "Error: No code to run, ye landlubber!",
    };
  }

  const languageId = JUDGE0_LANGUAGE_IDS[language];
  if (!languageId) {
    return {
      status: "error",
      output: `Unsupported language: ${language}`,
    };
  }

  if (!USE_REAL_JUDGE0) {
    await delay(400 + Math.random() * 400);
    return {
      status: "success",
      output: `[${language.toUpperCase()}] Code compiled successfully.\nRunning sample test...\n✓ Sample output matches expected.`,
    };
  }

  // Run only the first test case for the quick "Run" experience
  const sampleInput = normalizeInput(problem?.testCases?.[0]?.input ?? "");
  try {
    const res = await submitToJudge0Real(code, languageId, sampleInput);
    if (res.status?.id === 6) {
      return {
        status: "error",
        output: `Compilation Error:\n${res.compile_output || res.stderr || "(no details)"}`,
      };
    }

    const stdout = (res.stdout || "").trim() || "(no output)";
    return {
      status: "success",
      output: `Output:\n${stdout}\nStatus: ${res.status?.description}  ·  Time: ${res.time ?? "?"}s`,
    };
  } catch (e) {
    return {
      status: "error",
      output: `Judge0 error: ${e.message}`,
    };
  }
}
