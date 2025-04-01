import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Navbar from './Navbar_Other';

const Home = () => {
  const [activeButton, setActiveButton] = useState(null);
  const navigate = useNavigate();

  const handleButtonHover = (buttonName) => {
    setActiveButton(buttonName);
  };

  const handleButtonLeave = () => {
    setActiveButton(null);
  };

  const handleTake_AttendanceClick = () => {
    navigate('/take_attendance');
  };

  const handleStudent_RegistrationClick = () => {
    navigate('/student_registration');
  };

  const handleReportsClick = () => {
    navigate('/reports');
  };

  const handleCoursesClick = () => {
    navigate('/courses');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogoutClick = async () => {
    try {
      // Assuming user email is stored in localStorage after login
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found in localStorage');
        navigate('/'); // Navigate to startup page even if no email is found
        return;
      }

      // Call the logout API
      const response = await fetch('http://localhost:5000/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear user data from localStorage (or wherever you store it)
        localStorage.removeItem('userEmail');
        console.log(data.message); // "Logout successful"
        navigate('/'); // Navigate to startup page
      } else {
        console.error('Logout failed:', data.error);
        // Optionally handle failed logout (e.g., show an error message)
        navigate('/'); // Still navigate to startup page as a fallback
      }
    } catch (error) {
      console.error('Error during logout:', error.message);
      // Navigate to startup page even if there's an error
      navigate('/');
    }
  };

  return (
    <>
      <Navbar />
      <div className="home-container">
        {/* Background circles */}
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
        
        <div className="home-content">
          <h1 className="home-title">Dashboard</h1>
          <p className="home-description">
            Welcome to our student attendance management system. Select an option below to get started.
          </p>
          
          <div className="home-buttons-grid">
            <button 
              className={`home-button ${activeButton === 'attendance' ? 'active' : ''}`}
              onMouseEnter={() => handleButtonHover('attendance')}
              onMouseLeave={handleButtonLeave}
              onClick={handleTake_AttendanceClick}
            >
              <div className="button-icon">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <span>Take Attendance</span>
            </button>
            
            <button 
              className={`home-button ${activeButton === 'registration' ? 'active' : ''}`}
              onMouseEnter={() => handleButtonHover('registration')}
              onMouseLeave={handleButtonLeave}
              onClick={handleStudent_RegistrationClick}
            >
              <div className="button-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <span>Student Registration</span>
            </button>
            
            <button 
              className={`home-button ${activeButton === 'reports' ? 'active' : ''}`}
              onMouseEnter={() => handleButtonHover('reports')}
              onMouseLeave={handleButtonLeave}
              onClick={handleReportsClick}
            >
              <div className="button-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <span>Reports</span>
            </button>
            
            <button 
              className={`home-button ${activeButton === 'courses' ? 'active' : ''}`}
              onMouseEnter={() => handleButtonHover('courses')}
              onMouseLeave={handleButtonLeave}
              onClick={handleCoursesClick}
            >
              <div className="button-icon">
                <i className="fas fa-book"></i>
              </div>
              <span>Courses</span>
            </button>
            
            <button 
              className={`home-button ${activeButton === 'settings' ? 'active' : ''}`}
              onMouseEnter={() => handleButtonHover('settings')}
              onMouseLeave={handleButtonLeave}
              onClick={handleSettingsClick}
            >
              <div className="button-icon">
                <i className="fas fa-cog"></i>
              </div>
              <span>Settings</span>
            </button>
          </div>
          
          <button 
            className={`logout-button ${activeButton === 'logout' ? 'active' : ''}`}
            onMouseEnter={() => handleButtonHover('logout')}
            onMouseLeave={handleButtonLeave}
            onClick={handleLogoutClick}
          >
            <div className="button-icon">
              <i className="fas fa-sign-out-alt"></i>
            </div>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>  
  );
};

export default Home;