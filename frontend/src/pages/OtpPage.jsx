import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/login.css';
import '../styles/otp.css';
import { API_BASE } from "../config/api";

function OtpPage() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // Expect email and kriyaId to be passed via state from Login.jsx
    const email = location.state?.email;
    const kriyaId = location.state?.kriyaId;

    useEffect(() => {
        if (!email || !kriyaId) {
            // If no email or kriyaId is provided, redirect back to login
            navigate('/codequest/login');
        }
    }, [email, kriyaId, navigate]);

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/otp/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    kriyaID: kriyaId,
                    email,
                    otp
                })
            });

            // Handle non-JSON responses gracefully
            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                data = { success: res.ok, message: await res.text() };
            }

            if (!res.ok || (data.success !== undefined && data.success === false)) {
                setError(data.message || "Invalid OTP. Please try again.");
            } else {
                // Success - Store token and team info
                localStorage.setItem("token", data.token);
                localStorage.setItem("team", JSON.stringify(data.team));

                console.log("OTP Verification Success. Redirecting...");
                setSuccess(true);
                // navigate to ship landing after brief success message
                setTimeout(() => {
                    console.log("Executing navigation to /codequest/shiplanding");
                    navigate("/codequest/shiplanding");
                }, 1500);
            }

        } catch (err) {
            console.error("OTP Verification Error:", err);
            setError("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setResendLoading(true);
        
        try {
            const res = await fetch(`${API_BASE}/api/otp/send-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ kriyaID: kriyaId, email })
            });

            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                data = { success: res.ok, message: await res.text() };
            }

            if (!res.ok || !data.success) {
                setError(data.message || "Failed to resend OTP.");
            } else {
                // Temporarily show success message in error div or just alert
                setError("New OTP sent successfully!");
                setTimeout(() => setError(""), 3000);
            }
        } catch (err) {
            console.error("Resend OTP Error:", err);
            setError("Server error. Please try again.");
        } finally {
            setResendLoading(false);
        }
    };

    if (!email || !kriyaId) return null; // Will redirect in useEffect

    return (
        <div className="login-container">
            <div className="login-glass-card">
                <div className="login-header">
                    <h1>KRIYA<span>2026</span></h1>
                    <p>Identity Verification</p>
                </div>

                {success ? (
                    <div className="success-message">
                        Verification successful! Redirecting to fleet...
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleVerifyOtp}>
                            <div className="form-group">
                                <label>ENTER OTP SENT TO {email}</label>
                                <input
                                    type="text"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="login-btn"
                                disabled={loading || otp.length < 4}
                            >
                                {loading ? "Verifying..." : "Verify Identity"}
                            </button>
                        </form>
                        
                        <button 
                            type="button" 
                            className="resend-btn"
                            onClick={handleResendOtp}
                            disabled={resendLoading || loading}
                        >
                            {resendLoading ? "Sending..." : "Resend OTP"}
                        </button>
                    </>
                )}

                {error && <div className={error.includes("successfully") ? "success-message" : "error-message"}>
                    {error}
                </div>}

                <div className="login-footer">
                    <p>Protected by Kriya Security Protocol</p>
                </div>
            </div>
        </div>
    );
}

export default OtpPage;
