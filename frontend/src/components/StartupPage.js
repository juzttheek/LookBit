// src/StartupPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartupPage.css'; // Import the CSS file

const StartupPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Adding font link to head
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    return () => {
      document.head.removeChild(fontLink);
    };
  }, []);

  const handleMoveOnClick = () => {
    navigate('/login');
  };

  return (
    <div className="startup-container">
      {/* Animated background elements */}
      <div className="bg-circle"></div>
      <div className="bg-circle"></div>
      <div className="bg-circle"></div>
      
      <div className="startup-content">
        <h1 className="startup-title">LookBit</h1>
        <p className="startup-description">
        AI-Powered System Automating Attendance Using Real-Time Face Recognition Technology.
        </p>
        <button 
          className="startup-button" 
          onClick={handleMoveOnClick}
        >
          Begin ➔
        </button>
      </div>
    </div>
  );
};

export default StartupPage;