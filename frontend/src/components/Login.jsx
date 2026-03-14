import { useState } from 'react'
import { useNavigate } from "react-router-dom"
import '../styles/login.css'
import psglogo from '../assets/PSG.jpg'
import { API_BASE } from "../config/api";

function Login({ onLoginSuccess }) {

    const [kriyaId, setKriyaId] = useState('')
    const [email, setEmail] = useState('')

    // OTP states (disabled for now)
    // const [otp, setOtp] = useState('')
    // const [stage, setStage] = useState('input')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {

            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    kriyaId,
                    email
                })
            })

            const data = await res.json()

            if (!data.success) {
                setError(data.message)
            } else {
                // Identity verified, now trigger OTP
                try {
                    const otpRes = await fetch(`${API_BASE}/api/otp/send-otp`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ kriyaID: kriyaId }) 
                    })

                    const otpData = await otpRes.json();

                    if (otpRes.ok) {
                        // Clear any old session data
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        // Navigate to OTP page with state
                        navigate("/codequest/otp", { 
                            state: { 
                                email: email, 
                                kriyaId: kriyaId 
                            } 
                        });
                    } else {
                        setError(otpData.message || "Failed to send OTP. Please try again.");
                    }
                } catch (otpErr) {
                    console.error("OTP Send Exception:", otpErr);
                    setError("Identity verified, but failed to send OTP. Please try again.");
                }
            }

        } catch (err) {
            console.error("Login Exception:", err);
            setError("Server error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-glass-card">

                <div className="login-header">
                    <h1>KRIYA<span>2026</span></h1>
                    <p>Secure Entry to the Sea of Code</p>
                </div>

                <form onSubmit={handleLogin}>

                    <div className="form-group">
                        <label>KRIYA ID</label>
                        <input
                            type="text"
                            placeholder="Enter your Kriya ID"
                            value={kriyaId}
                            onChange={(e) => setKriyaId(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>EMAIL ADDRESS</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {kriyaId && email && (
                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    )}

                </form>

                {error && <div className="error-message">{error}</div>}

                <div className="login-footer">
                    <p>Protected by Kriya Security Protocol</p>
                </div>

            </div>
        </div>
    )
}

export default Login