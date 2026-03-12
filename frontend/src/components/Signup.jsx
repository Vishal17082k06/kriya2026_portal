import { useState } from "react";
import "../styles/Signup.css";
import Login from "./Login.jsx";
import { API_BASE } from "../config/api";

function Signup() {
  const [teamName, setTeamName] = useState("");
  const [kriyaID, setKriyaID] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [regMail, setRegMail] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    const signupData = {
      teamName,
      kriyaID,
      captainName,
      regMail,
    };

    try {
     const res = await fetch(
  `${API_BASE}/api/auth/signup`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signupData),
  }
);
      

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Signup failed");
        return;
      }

      alert("Signup successful! Please login.");

      setTeamName("");
      setKriyaID("");
      setCaptainName("");
      setRegMail("");

      // show login component
      setShowLogin(true);

    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  // If signup finished → render Login page
  if (showLogin) {
    return <Login />;
  }

  return (
    <div className="signup-container">
      <div className="signup-glass-card">
        <div className="signup-header">
          <h1>
            KRIYA<span>2026</span>
          </h1>
          <p>Enlist in the Cyber Seas</p>
        </div>

        <form onSubmit={handleSignup}>
          <div className="signup-grid">
            <div className="form-group full-width">
              <label>Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Kriya ID</label>
              <input
                type="text"
                value={kriyaID}
                onChange={(e) => setKriyaID(e.target.value)}
                placeholder="Enter Kriya ID"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Captain Name</label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="Enter captain name"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Registered Mail ID</label>
              <input
                type="email"
                value={regMail}
                onChange={(e) => setRegMail(e.target.value)}
                placeholder="Enter registered email"
                required
              />
            </div>
          </div>

          <button type="submit" className="signup-btn">
            Create Account
          </button>

          <div className="switch-link">
            Already part of the crew?
            <button
              type="button"
              className="link-button"
              onClick={() => setShowLogin(true)}
            >
              Login Here
            </button>
          </div>
        </form>

        <div className="signup-footer">
          <p>KRIYA REGISTRATION PROTOCOL v2.6</p>
        </div>
      </div>
    </div>
  );
}

export default Signup;