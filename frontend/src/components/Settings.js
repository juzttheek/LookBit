import React, { useState, useEffect } from 'react'; // Added useEffect for fetching data
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import AdminProfileSettings from './AdminProfileSettings';
import StudentProfileSettings from './StudentProfileSettings';

const Settings = () => {
  const [activeView, setActiveView] = useState('main');
  const navigate = useNavigate();
  
  // State to hold settings data
  const [adminSettings, setAdminSettings] = useState(null);
  const [studentSettings, setStudentSettings] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [cameraSettings, setCameraSettings] = useState(null);

  // Fetch settings data on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch Admin Settings (assuming adminId is known, e.g., from auth context)
        const adminId = 'admin123'; // Replace with actual admin ID from auth
        const adminResponse = await fetch(`/api/settings/admin/${adminId}`);
        const adminData = await adminResponse.json();
        setAdminSettings(adminData);

        // Fetch Student Settings
        const studentResponse = await fetch('/api/settings/student');
        const studentData = await studentResponse.json();
        setStudentSettings(studentData);

        // Fetch System Settings
        const systemResponse = await fetch('/api/settings/system');
        const systemData = await systemResponse.json();
        setSystemSettings(systemData);

        // Fetch Camera Settings (assuming a default cameraId)
        const cameraId = 'camera1'; // Replace with actual camera ID
        const cameraResponse = await fetch(`/api/settings/camera/${cameraId}`);
        const cameraData = await cameraResponse.json();
        setCameraSettings(cameraData);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Function to handle navigation back to home
  const handleBackToHome = () => {
    navigate('/home'); // Navigate to the home route
  };

  const renderView = () => {
    switch (activeView) {
      case 'admin':
        return <AdminProfileSettings onBack={() => setActiveView('main')} />;
      case 'student':
        return <StudentProfileSettings onBack={() => setActiveView('main')} />;
      default:
        return (
          <>
            {/* Top back button - ADDED HERE */}
            <button className="s-top-back-button" onClick={handleBackToHome}>
              <span className="back-icon">←</span> Back
            </button>
            <div className="settings-header">
              <h1 className="settings-title">Attendance System Settings</h1>
              <p className="settings-subtitle">
                Configure your face recognition-based attendance system
              </p>
            </div>
            
            <div className="settings-card-container">
              <div className="settings-card" onClick={() => setActiveView('admin')}>
                <div className="settings-card-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <h2 className="settings-card-title">Admin Profile</h2>
                <p className="settings-card-description">
                  Configure administrator settings, manage user permissions, and control system behavior.
                  Customize notification preferences and security options.
                </p>
                <button className="settings-card-button">Configure</button>
              </div>
              
              <div className="settings-card" onClick={() => setActiveView('student')}>
                <div className="settings-card-icon">
                  <i className="fas fa-user-graduate"></i>
                </div>
                <h2 className="settings-card-title">Student Profile</h2>
                <p className="settings-card-description">
                  Manage student profiles, facial recognition data, and attendance records.
                  Set up automated notifications and generate attendance reports.
                </p>
                <button className="settings-card-button">Configure</button>
              </div>
              
              {/*<div className="settings-card">
                <div className="settings-card-icon">
                  <i className="fas fa-cogs"></i>
                </div>
                <h2 className="settings-card-title">System Settings</h2>
                <p className="settings-card-description">
                  Adjust system parameters, facial recognition thresholds, and database configurations.
                  Manage storage and backup options for the attendance system.
                </p>
                <button className="settings-card-button">Configure</button>
              </div>*/}
              
              {/*<div className="settings-card">
                <div className="settings-card-icon">
                  <i className="fas fa-camera"></i>
                </div>
                <h2 className="settings-card-title">Camera Settings</h2>
                <p className="settings-card-description">
                  Configure camera devices, resolution settings, and recognition parameters.
                  Adjust lighting compensation and facial detection sensitivity.
                </p>
                <button className="settings-card-button">Configure</button>
              </div>*/}
            </div>
          </>
        );
    }
  };

  return (
    <div className="settings-container">
      {/* Background circles */}
      <div className="bg-circle"></div>
      <div className="bg-circle"></div>
      <div className="bg-circle"></div>
      
      <div className="settings-content-wrapper">
        <div className="settings-content">
          {renderView()}
        </div>
        
        {/* Modified Back button - moved inside content wrapper so it scrolls with content */}
        {/*<button className="settings-home-button" onClick={handleBackToHome}>
          <span className="settings-back-icon">←</span> Back to Home
        </button>*/}
      </div>
    </div>
  );
};

export default Settings;