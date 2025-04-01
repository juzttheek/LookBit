// src/AdminProfileSettings.js
import React, { useState } from 'react';
import './Settings.css';

const AdminProfileSettings = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: 'Admin User',
    email: 'admin@facerec.io',
    phone: '+1 (555) 123-4567',
    department: 'System Administration',
    role: 'Super Administrator',
    notificationsEmail: true,
    notificationsPush: true,
    notificationsSMS: false,
    systemAccess: 'Full Access',
    apiAccess: true,
    dataRetention: '90 days',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save logic would go here
    alert('Admin profile settings updated successfully!');
  };

  return (
    <>
      <button className="settings-back-button" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Settings
      </button>
      
      <div className="profile-settings-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <i className="fas fa-user-shield"></i>
            <div className="profile-avatar-overlay">
              <i className="fas fa-camera"></i>
            </div>
          </div>
          <div>
            <h2 className="profile-title">Admin Profile Settings</h2>
            <p className="profile-subtitle">Manage your administrator account and system permissions</p>
          </div>
        </div>
        
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Personal Info
          </button>
          <button 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button 
            className={`settings-tab ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permissions
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {activeTab === 'profile' && (
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Admin Role</label>
                <select
                  id="role"
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Super Administrator">Super Administrator</option>
                  <option value="Department Admin">Department Admin</option>
                  <option value="Report Admin">Report Admin</option>
                  <option value="User Manager">User Manager</option>
                </select>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="profile-form">
              <div className="form-group">
                <label>Notification Preferences</label>
                <div style={{ marginTop: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      name="notificationsEmail"
                      checked={formData.notificationsEmail}
                      onChange={handleChange}
                      style={{ marginRight: "10px" }}
                    />
                    Email Notifications
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      name="notificationsPush"
                      checked={formData.notificationsPush}
                      onChange={handleChange}
                      style={{ marginRight: "10px" }}
                    />
                    Push Notifications
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      name="notificationsSMS"
                      checked={formData.notificationsSMS}
                      onChange={handleChange}
                      style={{ marginRight: "10px" }}
                    />
                    SMS Notifications
                  </label>
                </div>
              </div>
              
              <div className="form-group-full">
                <label>Notification Events</label>
                <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    System Alerts
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    User Registration
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={false}
                      style={{ marginRight: "10px" }}
                    />
                    Daily Reports
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    Recognition Failures
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'permissions' && (
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="systemAccess">System Access Level</label>
                <select
                  id="systemAccess"
                  name="systemAccess"
                  className="form-control"
                  value={formData.systemAccess}
                  onChange={handleChange}
                >
                  <option value="Full Access">Full Access</option>
                  <option value="Department Only">Department Only</option>
                  <option value="View Only">View Only</option>
                  <option value="Reports Only">Reports Only</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>API Access</label>
                <label style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
                  <input
                    type="checkbox"
                    name="apiAccess"
                    checked={formData.apiAccess}
                    onChange={handleChange}
                    style={{ marginRight: "10px" }}
                  />
                  Enable API Access
                </label>
              </div>
              
              <div className="form-group-full">
                <label>Module Permissions</label>
                <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    User Management
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    Attendance Records
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    System Configuration
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    Reports & Analytics
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    Camera Management
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={false}
                      style={{ marginRight: "10px" }}
                    />
                    Audit Logs
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="password">Change Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Confirm new password"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dataRetention">Data Retention Period</label>
                <select
                  id="dataRetention"
                  name="dataRetention"
                  className="form-control"
                  value={formData.dataRetention}
                  onChange={handleChange}
                >
                  <option value="30 days">30 days</option>
                  <option value="60 days">60 days</option>
                  <option value="90 days">90 days</option>
                  <option value="180 days">180 days</option>
                  <option value="365 days">365 days</option>
                </select>
              </div>
              
              <div className="form-group-full">
                <label>Security Options</label>
                <div style={{ marginTop: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    Enable Two-Factor Authentication
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    Enforce Session Timeout
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      checked={false}
                      style={{ marginRight: "10px" }}
                    />
                    Require Password Change Every 90 Days
                  </label>
                </div>
              </div>
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onBack}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminProfileSettings;