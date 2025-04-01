import React, { useState, useEffect } from 'react';
import './Settings.css';

const StudentProfileSettings = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    department: 'Computer Science',
    year: '3',
    course: 'B.Tech',
    notificationsEmail: true,
    notificationsPush: true,
    notificationsSMS: false,
    faceDataUploaded: true,
    faceDataLastUpdated: '2024-12-15',
    attendanceAlerts: true,
    manualCheckInAllowed: false
  });

  // Fetch student data when a student is selected
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetails(selectedStudent._id); // Use _id from MongoDB
    }
  }, [selectedStudent]);

  // Function to fetch student details by ID
  const fetchStudentDetails = async (studentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/settings/students/${studentId}`);
      if (response.ok) {
        const studentData = await response.json();
        setFormData({
          name: studentData.name || '',
          email: studentData.email || '',
          studentId: studentData.studentId || '',
          department: studentData.department || 'Computer Science',
          year: studentData.year || '3',
          course: studentData.course || 'B.Tech',
          notificationsEmail: studentData.notificationsEmail !== undefined ? studentData.notificationsEmail : true,
          notificationsPush: studentData.notificationsPush !== undefined ? studentData.notificationsPush : true,
          notificationsSMS: studentData.notificationsSMS !== undefined ? studentData.notificationsSMS : false,
          faceDataUploaded: studentData.faceDataUploaded !== undefined ? studentData.faceDataUploaded : true,
          faceDataLastUpdated: studentData.faceDataLastUpdated || '2024-12-15',
          attendanceAlerts: studentData.attendanceAlerts !== undefined ? studentData.attendanceAlerts : true,
          manualCheckInAllowed: studentData.manualCheckInAllowed !== undefined ? studentData.manualCheckInAllowed : false
        });
      } else {
        console.error('Failed to fetch student details');
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Search for students
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/settings/students/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        console.error('Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select a student from search results
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Reset search and selected student
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStudent(null);
    setFormData({
      name: '',
      email: '',
      studentId: '',
      department: 'Computer Science',
      year: '3',
      course: 'B.Tech',
      notificationsEmail: true,
      notificationsPush: true,
      notificationsSMS: false,
      faceDataUploaded: true,
      faceDataLastUpdated: '2024-12-15',
      attendanceAlerts: true,
      manualCheckInAllowed: false
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      alert('Please search and select a student first');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/settings/students/${selectedStudent._id}`, { // Use _id from MongoDB
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        alert('Student profile updated successfully!');
      } else {
        alert('Failed to update student profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <>
      <button className="settings-back-button" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Settings
      </button>
      
      <div className="profile-settings-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <i className="fas fa-user-graduate"></i>
            <div className="profile-avatar-overlay">
              <i className="fas fa-camera"></i>
            </div>
          </div>
          <div>
            <h2 className="profile-title">Student Profile Settings</h2>
            <p className="profile-subtitle">Manage student information and facial recognition data</p>
          </div>
        </div>
        
        {/* Student Search Section */}
        <div className="student-search-section" style={{ marginBottom: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="form-control"
              style={{ flex: 1 }}
            />
            <button 
              type="submit" 
              className="settings-card-button" 
              disabled={isSearching}
              style={{ minWidth: '100px' }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            {selectedStudent && (
              <button 
                type="button" 
                onClick={handleClearSearch} 
                className="btn-cancel"
                style={{ minWidth: '100px' }}
              >
                Clear
              </button>
            )}
          </form>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results" style={{ 
              background: 'rgba(20, 22, 35, 0.7)',
              borderRadius: '10px',
              padding: '10px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '10px', fontSize: '1rem' }}>Search Results</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {searchResults.map(student => (
                  <li 
                    key={student._id} 
                    style={{ 
                      padding: '8px 12px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      marginBottom: '5px',
                      background: 'rgba(40, 42, 55, 0.8)'
                    }}
                    onClick={() => handleSelectStudent(student)}
                  >
                    <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                    <div style={{ fontSize: '0.9rem', opacity: '0.7' }}>
                      ID: {student.studentId} | {student.email}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Selected Student Info */}
          {selectedStudent && (
            <div style={{ 
              background: 'rgba(20, 22, 35, 0.7)',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{ 
                background: 'rgba(40, 42, 55, 0.8)',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="fas fa-user-graduate" style={{ fontSize: '24px' }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  Editing: {selectedStudent.name}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: '0.7' }}>
                  ID: {selectedStudent.studentId} | {selectedStudent.email}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Personal Info
          </button>
          <button 
            className={`settings-tab ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
          >
            Academic
          </button>
          <button 
            className={`settings-tab ${activeTab === 'facial-data' ? 'active' : ''}`}
            onClick={() => setActiveTab('facial-data')}
          >
            Facial Data
          </button>
          <button 
            className={`settings-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
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
                <label htmlFor="studentId">Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  className="form-control"
                  value={formData.studentId}
                  onChange={handleChange}
                />
              </div>
              
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
            </div>
          )}
          
          {activeTab === 'academic' && (
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="course">Course</label>
                <select
                  id="course"
                  name="course"
                  className="form-control"
                  value={formData.course}
                  onChange={handleChange}
                >
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="BBA">BBA</option>
                  <option value="MBA">MBA</option>
                  <option value="BSc">BSc</option>
                  <option value="MSc">MSc</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="year">Year of Study</label>
                <select
                  id="year"
                  name="year"
                  className="form-control"
                  value={formData.year}
                  onChange={handleChange}
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
              
              <div className="form-group-full">
                <label>Enrolled Courses</label>
                <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    CS401: Advanced Algorithms
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    CS402: Machine Learning
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    CS403: Web Development
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    CS404: Computer Networks
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={false}
                      style={{ marginRight: "10px" }}
                    />
                    CS405: Database Systems
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={false}
                      style={{ marginRight: "10px" }}
                    />
                    CS406: Cloud Computing
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'facial-data' && (
            <div className="profile-form">
              <div className="form-group-full">
                <label>Facial Recognition Data</label>
                <div style={{ 
                  marginTop: "15px", 
                  padding: "20px", 
                  background: "rgba(20, 22, 35, 0.7)",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}>
                  {formData.faceDataUploaded ? (
                    <>
                      <div style={{ 
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "15px"
                      }}>
                        <i className="fas fa-check-circle" style={{ color: "#4CAF50", fontSize: "24px", marginRight: "10px" }}></i>
                        <span>Facial data is uploaded and ready for recognition</span>
                      </div>
                      <div style={{ fontSize: "0.9rem", opacity: "0.7", marginBottom: "20px" }}>
                        Last updated: {formData.faceDataLastUpdated}
                      </div>
                      <div style={{ 
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "15px",
                        width: "100%",
                        marginBottom: "20px"
                      }}>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <div key={num} style={{ 
                            background: "rgba(40, 42, 55, 0.8)",
                            height: "80px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            <i className="fas fa-user" style={{ fontSize: "30px", opacity: "0.5" }}></i>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                      <i className="fas fa-exclamation-triangle" style={{ color: "#FFC107", fontSize: "40px", marginBottom: "15px" }}></i>
                      <p>No facial recognition data has been uploaded yet</p>
                    </div>
                  )}
                  <button className="settings-card-button" style={{ alignSelf: "flex-start" }}>
                    Update Facial Data
                  </button>
                </div>
              </div>
              
              <div className="form-group-full" style={{ marginTop: "20px" }}>
                <label>Privacy Settings</label>
                <div style={{ marginTop: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      checked={true}
                      style={{ marginRight: "10px" }}
                    />
                    I consent to the collection and use of my facial data for attendance purposes
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      checked={false}
                      style={{ marginRight: "10px" }}
                    />
                    I allow my facial data to be used for system improvement and research
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'attendance' && (
            <div className="profile-form">
              <div className="form-group">
                <label>Attendance Settings</label>
                <div style={{ marginTop: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      name="attendanceAlerts"
                      checked={formData.attendanceAlerts}
                      onChange={handleChange}
                      style={{ marginRight: "10px" }}
                    />
                    Receive alerts for missed classes
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      name="manualCheckInAllowed"
                      checked={formData.manualCheckInAllowed}
                      onChange={handleChange}
                      style={{ marginRight: "10px" }}
                    />
                    Allow manual check-in if facial recognition fails
                  </label>
                </div>
 Actual attendance data would typically be fetched from the backend
              </div>
              
              <div className="form-group-full">
                <label>Attendance Summary</label>
                <div style={{ 
                  marginTop: "15px", 
                  padding: "20px", 
                  background: "rgba(20, 22, 35, 0.7)",
                  borderRadius: "10px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                      <div style={{ fontSize: "2rem", fontWeight: "bold" }}>87%</div>
                      <div style={{ fontSize: "0.9rem", opacity: "0.7" }}>Overall Attendance</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "2rem", fontWeight: "bold" }}>43/49</div>
                      <div style={{ fontSize: "0.9rem", opacity: "0.7" }}>Classes Attended</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "2rem", fontWeight: "bold" }}>6</div>
                      <div style={{ fontSize: "0.9rem", opacity: "0.7" }}>Classes Missed</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: "20px" }}>
                    <div style={{ fontSize: "1.1rem", marginBottom: "10px" }}>Course-wise Attendance</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span>CS401: Advanced Algorithms</span>
                          <span>92%</span>
                        </div>
                        <div style={{ 
                          height: "8px", 
                          background: "rgba(50, 52, 65, 0.7)", 
                          borderRadius: "4px",
                          overflow: "hidden"
                        }}>
                          <div style={{ 
                            height: "100%", 
                            width: "92%", 
                            background: "linear-gradient(90deg, #4776e6, #8e54e9)",
                            borderRadius: "4px"
                          }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span>CS402: Machine Learning</span>
                          <span>89%</span>
                        </div>
                        <div style={{ 
                          height: "8px", 
                          background: "rgba(50, 52, 65, 0.7)", 
                          borderRadius: "4px",
                          overflow: "hidden"
                        }}>
                          <div style={{ 
                            height: "100%", 
                            width: "89%", 
                            background: "linear-gradient(90deg, #4776e6, #8e54e9)",
                            borderRadius: "4px"
                          }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span>CS403: Web Development</span>
                          <span>95%</span>
                        </div>
                        <div style={{ 
                          height: "8px", 
                          background: "rgba(50, 52, 65, 0.7)", 
                          borderRadius: "4px",
                          overflow: "hidden"
                        }}>
                          <div style={{ 
                            height: "100%", 
                            width: "95%", 
                            background: "linear-gradient(90deg, #4776e6, #8e54e9)",
                            borderRadius: "4px"
                          }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span>CS404: Computer Networks</span>
                          <span>76%</span>
                        </div>
                        <div style={{ 
                          height: "8px", 
                          background: "rgba(50, 52, 65, 0.7)", 
                          borderRadius: "4px",
                          overflow: "hidden"
                        }}>
                          <div style={{ 
                            height: "100%", 
                            width: "76%", 
                            background: "linear-gradient(90deg, #4776e6, #8e54e9)",
                            borderRadius: "4px"
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-group-full" style={{ marginTop: "20px" }}>
                <button type="button" className="settings-card-button" style={{ width: "100%" }}>
                  View Complete Attendance Report
                </button>
              </div>
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onBack}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={!selectedStudent}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default StudentProfileSettings;