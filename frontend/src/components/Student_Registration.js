// src/Student_registration.js
import React, { useState, useRef } from 'react';
import './Student_Registration.css';
import axios from 'axios'; // Make sure to install axios: npm install axios
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const StudentRegistration = () => {
  // Add navigation hook
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    email: '',
    course: '',
  });
  
  const [photoTaken, setPhotoTaken] = useState(false);
  const [capturedImages, setCapturedImages] = useState({
    frontal: null,
    leftProfile: null,
    rightProfile: null,
    upwardTilt: null,
    downwardTilt: null
  });
  const [currentPose, setCurrentPose] = useState('frontal');
  const [registrationStep, setRegistrationStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [studentIdExists, setStudentIdExists] = useState(false);
  const [isCheckingId, setIsCheckingId] = useState(false);
  
  const poseInstructions = {
    frontal: "Look directly at the camera with a neutral expression",
    leftProfile: "Turn your head to show your left side profile",
    rightProfile: "Turn your head to show your right side profile",
    upwardTilt: "Tilt your head slightly upward",
    downwardTilt: "Tilt your head slightly downward"
  };
  
  const poseLabels = {
    frontal: "Frontal View (Mandatory)",
    leftProfile: "Left Profile (Side View)",
    rightProfile: "Right Profile (Side View)",
    upwardTilt: "Slightly Upward Tilt",
    downwardTilt: "Slightly Downward Tilt"
  };
  
  const posesOrder = ['frontal', 'leftProfile', 'rightProfile', 'upwardTilt', 'downwardTilt'];
  
  const videoRef = useRef(null);
  const photoRef = useRef(null);
  const streamRef = useRef(null);
  
  // Function to handle navigation back to home
  const handleBackToHome = () => {
    navigate('/home'); // Navigate to the home route
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear any previous errors
    setError(null);
    
    // Check student ID when it changes
    if (name === 'studentId' && value.length > 3) {
      checkStudentId(value);
    }
  };

  const checkStudentId = async (id) => {
    if (!id) return;
    
    setIsCheckingId(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/students/check/${id}`);
      setStudentIdExists(response.data.exists);
    } catch (error) {
      console.error("Error checking student ID:", error);
    } finally {
      setIsCheckingId(false);
    }
  };
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 480, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setError("Unable to access your camera. Please check permissions.");
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const capturePhoto = () => {
    const video = videoRef.current;
    const photo = photoRef.current;
    
    const context = photo.getContext('2d');
    context.drawImage(video, 0, 0, photo.width, photo.height);
    
    const imageData = photo.toDataURL('image/png');
    
    setCapturedImages({
      ...capturedImages,
      [currentPose]: imageData
    });
    
    // Move to next pose or complete
    const currentIndex = posesOrder.indexOf(currentPose);
    if (currentIndex < posesOrder.length - 1) {
      setCurrentPose(posesOrder[currentIndex + 1]);
    } else {
      setPhotoTaken(true);
      stopCamera();
    }
  };
  
  const retakePhotos = () => {
    setPhotoTaken(false);
    setCapturedImages({
      frontal: null,
      leftProfile: null,
      rightProfile: null,
      upwardTilt: null,
      downwardTilt: null
    });
    setCurrentPose('frontal');
    startCamera();
  };
  
  // Updated nextStep function
const nextStep = () => {
  // Validate first step data - Removed semester and section checks
  if (!formData.studentId || !formData.fullName || !formData.email || 
      !formData.course) {
    setError("Please fill in all required fields");
    return;
  }
  
  if (studentIdExists) {
    setError("This Student ID is already registered");
    return;
  }
  
  setError(null);
  setRegistrationStep(2);
  setTimeout(() => {
    startCamera();
  }, 500);
};
  
  const previousStep = () => {
    setRegistrationStep(1);
    stopCamera();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Check if mandatory frontal image is captured
    if (!capturedImages.frontal) {
      setError("Frontal face image is required");
      setIsLoading(false);
      return;
    }
    
    try {
      // Prepare data for submission
      const studentData = {
        ...formData,
        faceData: capturedImages
      };
      
      // Send data to backend
      const response = await axios.post('http://localhost:5000/api/students/register', studentData);
      
      if (response.status === 201) {
        setIsComplete(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      studentId: '',
      fullName: '',
      email: '',
      course: '',
    });
    setPhotoTaken(false);
    setCapturedImages({
      frontal: null,
      leftProfile: null,
      rightProfile: null,
      upwardTilt: null,
      downwardTilt: null
    });
    setCurrentPose('frontal');
    setRegistrationStep(1);
    setIsComplete(false);
    setError(null);
    setStudentIdExists(false);
  };
  
  // Check if all required poses are captured (only frontal is mandatory)
  const allPosesCaptured = capturedImages.frontal !== null;
  
  return (
    <div className="student-registration-container">
      <div className="bg-circle"></div>
      <div className="bg-circle"></div>
      <div className="bg-circle"></div>

      {/* Top back button - ADDED HERE */}
        
      
      <div className="registration-content">
        <h1 className="registration-title">Student Registration</h1>
        <button className="sr-top-back-button" onClick={handleBackToHome}>
          <span className="back-icon">←</span> Back
        </button>
        
        {isComplete ? (
          <div className="registration-success">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2>Registration Successful!</h2>
            <p>Your face data has been saved and you are now registered in the attendance system.</p>
            <button className="registration-button" onClick={resetForm}>Register Another Student</button>
          </div>
        ) : (
          <>
            <div className="progress-indicator">
              <div className={`progress-step ${registrationStep >= 1 ? 'active' : ''}`}>1</div>
              <div className="progress-line"></div>
              <div className={`progress-step ${registrationStep >= 2 ? 'active' : ''}`}>2</div>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {registrationStep === 1 ? (
                <div className="step-container step-details">
                  <div className="form-group">
                    <label>Student ID</label>
                    <div className="input-with-status">
                      <input 
                        type="text" 
                        name="studentId" 
                        value={formData.studentId} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="Enter your student ID"
                        className={studentIdExists ? 'input-error' : ''}
                      />
                      {isCheckingId && (
                        <span className="id-status checking">Checking...</span>
                      )}
                      {!isCheckingId && studentIdExists && formData.studentId && (
                        <span className="id-status taken">ID already taken</span>
                      )}
                      {!isCheckingId && !studentIdExists && formData.studentId && (
                        <span className="id-status available">ID available</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      name="fullName" 
                      value={formData.fullName} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Course</label>
                      <select 
                        name="course" 
                        value={formData.course} 
                        onChange={handleInputChange} 
                        required
                      >
                        <option value="">Select Course</option>
                        <option value="Computer Engineering">Computer Engineering</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Software Egineering">Software Engineering</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="registration-button" 
                      onClick={nextStep}
                      disabled={studentIdExists || isCheckingId}
                    >
                      Next: Capture Photos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="step-container step-photo">
                  <h3>Face Registration</h3>
                  
                  {!photoTaken ? (
                    <>
                      <div className="pose-indicator">
                        {posesOrder.map((pose, index) => (
                          <div 
                            key={pose} 
                            className={`pose-step ${pose === currentPose ? 'active' : ''} ${capturedImages[pose] ? 'completed' : ''}`}
                          >
                            {index + 1}
                          </div>
                        ))}
                      </div>
                      
                      <p className="photo-instruction">
                        <strong>{poseLabels[currentPose]}</strong><br />
                        {poseInstructions[currentPose]}
                      </p>
                      
                      <div className="camera-container">
                        <video 
                          ref={videoRef} 
                          className="camera-preview" 
                          autoPlay 
                          playsInline
                        />
                        <canvas 
                          ref={photoRef} 
                          className="photo-canvas" 
                          width="480" 
                          height="480" 
                          style={{ display: 'none' }}
                        />
                        <button 
                          type="button" 
                          className="capture-button" 
                          onClick={capturePhoto}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="captured-photos-grid">
                      {posesOrder.map(pose => (
                        <div key={pose} className="photo-preview-container">
                          <div className="photo-preview-label">{poseLabels[pose]}</div>
                          <img 
                            src={capturedImages[pose]} 
                            alt={`${pose} view`} 
                            className="captured-image-thumbnail" 
                          />
                        </div>
                      ))}
                      <button 
                        type="button" 
                        className="retake-button" 
                        onClick={retakePhotos}
                      >
                        Retake Photos
                      </button>
                    </div>
                  )}
                  
                  <div className="form-actions dual-buttons">
                    <button 
                      type="button" 
                      className="back-button" 
                      onClick={previousStep}
                    >
                      Back
                    </button>
                    
                    <button 
                      type="submit" 
                      className="registration-button" 
                      disabled={!allPosesCaptured || isLoading}
                    >
                      {isLoading ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        'Complete Registration'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </>
        )}
      </div>
      
      {/* Back button - added from Take_Attendance.js */}
      {/*<button className="back-button" onClick={handleBackToHome}>
        <span className="back-icon">←</span> Back to Home
      </button>*/}
    </div>
  );
};

export default StudentRegistration;