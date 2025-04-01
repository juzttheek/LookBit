// src/Take_Attendance.js
import React, { useState, useEffect, useRef } from 'react';
import './Take_Attendance.css';
import axios from 'axios'; // Make sure to install axios: npm install axios
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Take_Attendance = () => {
  // Add navigation hook
  const navigate = useNavigate();
  
  // State variables
  const [cameraActive, setCameraActive] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [attendanceList, setAttendanceList] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [embeddings, setEmbeddings] = useState(null);
  const [isLoadingEmbeddings, setIsLoadingEmbeddings] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentStudents: 0,
    absentStudents: 0,
    attendanceRate: 0
  });
  
  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Get current date in readable format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Initialize when component mounts
  useEffect(() => {
    // Load embeddings on component mount
    loadEmbeddings();
    
    // Load today's attendance records
    loadAttendanceRecords();
    
    return () => {
      // Clean up by stopping camera when component unmounts
      stopCamera();
    };
  }, []);

  // Function to handle navigation back to home
  const handleBackToHome = () => {
    navigate('/home'); // Navigate to the home route
  };

  // Function to load embeddings from server
  const loadEmbeddings = async () => {
    setIsLoadingEmbeddings(true);
    try {
      // First try to get latest embeddings
      const response = await axios.get('http://localhost:5000/api/embeddings/latest');
      
      // Check if embeddings are empty or incomplete
      if (!response.data.embeddings || Object.keys(response.data.embeddings).length === 0) {
        // Generate embeddings if none exist or they're empty
        await generateEmbeddings();
      } else {
        setEmbeddings(response.data.embeddings);
        console.log('Embeddings loaded successfully');
      }
    } catch (error) {
      console.error('Error loading embeddings:', error);
      
      // If no embeddings found, generate them
      if (error.response && error.response.status === 404) {
        await generateEmbeddings();
      } else {
        showErrorMessage('Failed to load embeddings');
      }
    } finally {
      setIsLoadingEmbeddings(false);
    }
  };

  // Function to check if embeddings need updating
  const checkEmbeddingsNeedUpdate = async () => {
    try {
      // Get all students
      const studentsResponse = await axios.get('http://localhost:5000/api/students/all');
      const studentsData = studentsResponse.data.students;
      
      // Get current embeddings
      const embeddingsResponse = await axios.get('http://localhost:5000/api/embeddings/latest');
      const currentEmbeddings = embeddingsResponse.data.embeddings;
      
      // Compare student count with embeddings
      const studentCount = studentsData.length;
      const embeddingsCount = Object.keys(currentEmbeddings).length;
      
      // If counts don't match or it's been more than a day since last update
      const lastUpdated = new Date(embeddingsResponse.data.lastUpdated);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      if (studentCount !== embeddingsCount || lastUpdated < oneDayAgo) {
        console.log(`Detected ${studentCount} students but ${embeddingsCount} embeddings. Regenerating...`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking embeddings:', error);
      return true; // Regenerate embeddings on error to be safe
    }
  };

  // Function to generate embeddings from student data
  const generateEmbeddings = async () => {
    try {
      // 1. Get all students
      const studentsResponse = await axios.get('http://localhost:5000/api/students/all');
      const studentsData = studentsResponse.data.students;
      
      if (!studentsData || studentsData.length === 0) {
        showErrorMessage('No students found for generating embeddings');
        setIsLoadingEmbeddings(false);
        return;
      }
      
      // 2. Prepare images for processing
      let allImages = [];
      studentsData.forEach(student => {
        allImages = [...allImages, ...student.images];
      });
      
      console.log(`Processing ${allImages.length} images for ${studentsData.length} students`);
      
      // 3. Process images with Flask backend
      const processResponse = await axios.post('http://localhost:5001/api/process-images', {
        images: allImages
      });
      
      const generatedEmbeddings = processResponse.data.embeddings;
      
      // 4. Save embeddings to MongoDB
      await axios.post('http://localhost:5000/api/embeddings/save', {
        embeddings: generatedEmbeddings
      });
      
      // 5. Update state with new embeddings
      setEmbeddings(generatedEmbeddings);
      setIsLoadingEmbeddings(false);
      showSuccessMessage('Student embeddings generated successfully');
      
    } catch (error) {
      console.error('Error generating embeddings:', error);
      setIsLoadingEmbeddings(false);
      showErrorMessage('Failed to generate embeddings');
    }
  };

  // Load attendance records for today
  const loadAttendanceRecords = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`http://localhost:5000/api/attendance/date/${today}`);
      
      setAttendanceList(response.data.records.map(record => ({
        id: record.studentId,
        name: record.fullName,
        avatar: record.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        time: record.time
      })));
      
      setStats(response.data.stats);
      
    } catch (error) {
      console.error('Error loading attendance records:', error);
      showErrorMessage('Failed to load attendance records');
    }
  };

  // Start camera function
  const startCamera = async () => {
    try {
      // First check if embeddings need updating
      const needsUpdate = await checkEmbeddingsNeedUpdate();
      if (needsUpdate) {
        setIsLoadingEmbeddings(true);
        await generateEmbeddings();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      showErrorMessage("Camera access denied. Please check permissions.");
    }
  };

  // Stop camera function
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setRecognizing(false);
    }
  };

  // Toggle camera function
  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Capture frame from video
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get the image data as base64
    return canvas.toDataURL('image/jpeg');
  };

  // Start recognition process
  const startRecognition = async () => {
    if (!cameraActive || !embeddings) {
      showErrorMessage(embeddings ? "Camera is not active" : "Face embeddings not loaded");
      return;
    }
    
    setRecognizing(true);
    
    try {
      // 1. Capture frame from video
      const imageData = captureFrame();
      if (!imageData) {
        throw new Error("Failed to capture image from camera");
      }
      
      // 2. Send frame to Flask backend for recognition
      const response = await axios.post('http://localhost:5001/api/recognize-face', {
        image: imageData,
        embeddings: embeddings
      });
      
      // 3. Handle recognition result
      const result = response.data;
      
      if (result.recognizedName && result.recognizedName !== "Unknown") {
        // Get student details from recognized ID
        try {
          // Assuming the recognizedName is the studentId 
          const studentResponse = await axios.get(`http://localhost:5000/api/students/check/${result.recognizedName}`);
          
          if (studentResponse.data.exists) {
            // Mark attendance
            const attendanceResponse = await axios.post('http://localhost:5000/api/attendance/mark', {
              studentId: result.recognizedName,
              time: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
            });
            
            if (attendanceResponse.data.attendanceRecord) {
              const record = attendanceResponse.data.attendanceRecord;
              
              // Add to attendance list
              const newAttendance = {
                id: record.studentId,
                name: record.fullName,
                avatar: record.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
                time: record.time
              };
              
              setAttendanceList(prev => [newAttendance, ...prev]);
              
              // Update stats
              setStats(prev => ({
                ...prev,
                presentStudents: prev.presentStudents + 1,
                absentStudents: prev.absentStudents - 1,
                attendanceRate: Math.round(((prev.presentStudents + 1) / prev.totalStudents) * 100)
              }));
              
              showSuccessMessage(`Attendance marked for ${record.fullName}`);
            } else {
              showSuccessMessage(attendanceResponse.data.message || "Student already marked present");
            }
          } else {
            showErrorMessage(`Student ID ${result.recognizedName} not found in database`);
          }
        } catch (error) {
          if (error.response && error.response.status === 400 && error.response.data.error === 'Attendance already marked for today') {
            showSuccessMessage(`${error.response.data.attendanceRecord.fullName} already marked present`);
          } else {
            console.error('Error marking attendance:', error);
            showErrorMessage('Failed to mark attendance');
          }
        }
      } else {
        showErrorMessage("No student recognized or confidence too low");
      }
    } catch (error) {
      console.error('Recognition error:', error);
      showErrorMessage('Face recognition failed');
    } finally {
      setRecognizing(false);
    }
  };

  // Show success message with auto hide
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Show error message with auto hide
  const showErrorMessage = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');
    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  };

  return (
    <div className="attendance-container">

        
      {/* Background animated circles */}
      <div className="bg-circle"></div>
      <div className="bg-circle"></div>
      <div className="bg-circle"></div>
      
      {/* Success/Error message notification */}
      <div className={`success-message ${successMessage ? 'show' : ''}`}>
        {successMessage}
      </div>
      <div className={`error-message ${errorMessage ? 'show' : ''}`}>
        {errorMessage}
      </div>
      
      {/* Top back button - ADDED HERE */}
      {/*<button className="top-back-button" onClick={handleBackToHome}>
        <span className="back-icon">←</span> Back
      </button>*/}
      
      {/* Header section */}
      <div className="attendance-header">
      <button className="ta-top-back-button" onClick={handleBackToHome}>
        <span className="back-icon">←</span> Back
        </button>
        
        <h1 className="attendance-title">Face Recognition Attendance</h1>
        <p className="attendance-subtitle">Capture attendance using facial recognition</p>
        {isLoadingEmbeddings && <p className="loading-text">Loading face recognition data...</p>}
      </div>
      
      {/* Main content */}
      <div className="attendance-main">
        {/* Camera section */}
        <div className="camera-section">
          <div className="camera-container">
            <video 
              ref={videoRef}
              className="camera-feed"
              autoPlay
              playsInline
              muted
            />
            
            {/* Hidden canvas for capturing frames */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Camera overlay elements */}
            <div className="camera-overlay">
              <div className="camera-status">
                <span className={`status-indicator ${cameraActive ? 'active' : ''}`}></span>
                {cameraActive ? 'Camera Active' : 'Camera Inactive'}
              </div>
              
              <div className={`face-indicator ${recognizing ? 'active' : ''}`}>
                {recognizing ? 'Recognizing Face...' : ''}
              </div>
            </div>
            
            {/* Recognition animation border */}
            {recognizing && <div className="recognition-animation"></div>}
            
            {/* Show placeholder if camera is inactive */}
            {!cameraActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#999',
                fontSize: '1.2rem'
              }}>
                Camera is off
              </div>
            )}
          </div>
          
          {/* Camera control buttons */}
          <div className="camera-controls">
            <button 
              className="camera-button"
              onClick={toggleCamera}
              disabled={isLoadingEmbeddings}
            >
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
            
            <button 
              className={`camera-button ${(!cameraActive || recognizing || !embeddings) ? 'disabled' : ''}`}
              onClick={startRecognition}
              disabled={!cameraActive || recognizing || !embeddings || isLoadingEmbeddings}
            >
              {recognizing ? 'Recognizing...' : 'Mark Attendance'}
            </button>
          </div>
        </div>
        
        {/* Attendance records section */}
        <div className="attendance-section">
          <div className="attendance-card">
            <div className="attendance-card-header">
              <div className="attendance-card-title">Attendance Record</div>
              <div className="attendance-date">{currentDate}</div>
            </div>
            
            {/* List of students who are present */}
            <div className="attendance-list">
              {attendanceList.length > 0 ? (
                attendanceList.map((student, index) => (
                  <div className="attendance-item" key={index}>
                    <div className="attendance-avatar">{student.avatar}</div>
                    <div className="attendance-details">
                      <div className="attendance-name">{student.name}</div>
                      <div className="attendance-id">{student.id}</div>
                    </div>
                    <div className="attendance-time">{student.time}</div>
                  </div>
                ))
              ) : (
                <div className="attendance-empty">
                  <div className="empty-icon">📋</div>
                  <div>No attendance records yet</div>
                  <div style={{ fontSize: '0.9rem', marginTop: '10px', maxWidth: '250px' }}>
                    Start the camera and click "Mark Attendance" to begin
                  </div>
                </div>
              )}
            </div>
            
            {/* Attendance summary statistics */}
            <div className="attendance-summary">
              <div className="summary-item">
                <div className="summary-value">{stats.presentStudents}</div>
                <div className="summary-label">Present</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-value">{stats.absentStudents}</div>
                <div className="summary-label">Absent</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-value">{stats.attendanceRate}%</div>
                <div className="summary-label">Attendance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom back button (original) - now can remove this if desired */}
      {/* <button className="back-button" onClick={handleBackToHome}>
        <span className="back-icon">←</span> Back to Home
      </button> */}
    </div>
  );
};

export default Take_Attendance;