import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config/api';

const ProtectedRoute = ({ children, round }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [inRound2, setInRound2] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem("token");
            const storedTeam = JSON.parse(localStorage.getItem("team") || "{}");
            const teamId = storedTeam.id || storedTeam._id || storedTeam.kriyaID || storedTeam.kriyaId || storedTeam.kriyaid;

            if (!token || !teamId) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/teams/profile/${teamId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const teamData = await res.json();
                    setIsAuthorized(true);
                    
                    // Check if team has started Round 2
                    const hasRound2Status = teamData.round2?.problemsStatus && teamData.round2.problemsStatus.length > 0;
                    setInRound2(hasRound2Status);
                    
                    // Update localStorage with latest team data
                    localStorage.setItem("team", JSON.stringify(teamData));
                } else {
                    setIsAuthorized(false);
                }
            } catch (err) {
                console.error("Auth verification failed", err);
                // If network fails, fallback to localStorage if it exists
                if (token && teamId) {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, [location.pathname]);

    if (isLoading) {
        return (
            <div style={{ 
                height: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#020c1b',
                color: '#c9a84c',
                fontFamily: 'Pirata One, cursive',
                fontSize: '2rem'
            }}>
                ⚓ Navigating the High Seas...
            </div>
        );
    }

    if (!isAuthorized) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Logic: If user is in Round 2, they cannot go back to Round 1 pages
    const isRound1Page = ['shiplanding', 'anchorage', 'sea'].some(p => location.pathname.includes(p));
    
    if (inRound2 && isRound1Page) {
        console.warn("Attempted to access Round 1 while in Round 2. Redirecting to Map.");
        return <Navigate to="/map" replace />;
    }

    return children;
};

export default ProtectedRoute;
