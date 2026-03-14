import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
    return (
        <div className="not-found-container">
            <div className="not-found-card">
                <div className="skull-icon">☠️</div>
                <h1 className="not-found-title">404 - Lost at Sea</h1>
                <p className="not-found-text">
                    Arrr! It seems you've sailed into uncharted waters, matey. 
                    This map shows nothing but the endless abyss.
                </p>
                <div className="compass-decoration">🧭</div>
                <Link to="/" className="back-home-btn">
                    Return to Safe Harbour
                </Link>
            </div>
            <div className="wave-animation">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
            </div>
        </div>
    );
};

export default NotFound;
