import React, { useState, useEffect } from 'react';
import { Search, Plus, Book, Clock, Users, ExternalLink, CheckCircle, Trash } from 'lucide-react';
import './Courses.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Courses = () => {
  const navigate = useNavigate();
  
  // Function to handle navigation back to home
  const handleBackToHome = () => {
    navigate('/home'); // Navigate to the home route
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Course was added successfully!');
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    instructor: '',
    description: '',
    status: 'active',
    students: '',
    duration: ''
  });

  // Items per page
  const itemsPerPage = 6;

  // Fetch courses from API
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/getcourses', {
        params: {
          search: searchQuery,
          page: currentPage,
          limit: itemsPerPage
        }
      });
      setCourses(response.data.courses);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch courses on component mount and when dependencies change
  useEffect(() => {
    fetchCourses();
  }, [searchQuery, currentPage]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id.replace('course', '').toLowerCase()]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/addcourses', {
        code: formData.code,
        title: formData.title,
        instructor: formData.instructor,
        description: formData.description,
        status: formData.status,
        students: parseInt(formData.students),
        duration: formData.duration
      });
      
      // Reset form
      setFormData({
        code: '',
        title: '',
        instructor: '',
        description: '',
        status: 'active',
        students: '',
        duration: ''
      });
      
      // Close modal
      setShowModal(false);
      
      // Show success toast
      setToastMessage('Course was added successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      // Refresh courses
      fetchCourses();
    } catch (error) {
      console.error('Error adding course:', error);
      // Could add error toast here
    }
  };

  // Handle delete course
  const handleDeleteCourse = async (courseId, event) => {
    // Prevent the click from selecting the card
    event.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await axios.delete(`http://localhost:5000/api/deletecourse/${courseId}`);
        
        // Show success toast
        setToastMessage('Course was deleted successfully!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // Refresh courses
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        // Could add error toast here
      }
    }
  };

  // Open add course modal
  const handleAddCourse = () => {
    setShowModal(true);
  };

  // Handle card selection
  const handleCardClick = (course) => {
    setSelectedCourse(course);
  };

  return (
    <div className="courses-container">
      {/* Background decoration */}
      <div className="bg-circle"></div>
      
      {/* Add courses-content-wrapper for scrolling */}
      <div className="courses-content-wrapper">
        <div className="header">
          <button className="c-top-back-button" onClick={handleBackToHome}>
            <span className="back-icon">←</span> Back
          </button>
          <div className="header-title">Manage Courses</div>
        </div>
        
        <div className="main-content">
          
          <div className="controls">
            <div className="search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button className="add-course-btn" onClick={handleAddCourse}>
              <Plus size={16} />
              Add New Course
            </button>
          </div>
          
          {isLoading ? (
            // Skeleton loading (removed but keeping structure)
            <div className="courses-grid">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="course-card skeleton">
                  {/* Skeleton structure */}
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            // Empty state
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h2 className="empty-title">No courses found</h2>
              <p className="empty-description">
                There are no courses matching your search criteria. Try adjusting your search or add a new course.
              </p>
              <button className="add-course-btn" onClick={handleAddCourse}>
                <Plus size={16} />
                Add New Course
              </button>
            </div>
          ) : (
            // Course cards grid
            <div className="courses-grid">
              {courses.map((course) => (
                <div 
                  key={course._id} 
                  className={`course-card ${selectedCourse && selectedCourse._id === course._id ? 'selected' : ''}`}
                  onClick={() => handleCardClick(course)}
                >
                  <div className={`course-badge status-${course.status}`}>
                    {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                  </div>
                  
                  <div className="course-header">
                    <div className="course-code">{course.code}</div>
                    <div className="course-title">{course.title}</div>
                    <div className="course-instructor">
                      <Users size={14} />
                      {course.instructor}
                    </div>
                  </div>
                  
                  <div className="course-body">
                    <div className="course-stats">
                      <div className="stat-item">
                        <div className="stat-value">{course.students}</div>
                        <div className="stat-label">Students</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{course.duration}</div>
                        <div className="stat-label">Duration</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{course.progress}%</div>
                        <div className="stat-label">Progress</div>
                      </div>
                    </div>
                    
                    <div className="course-description">
                      {course.description}
                    </div>
                    
                    <div className="course-actions">
                      <button className="action-btn details-btn">
                        <ExternalLink size={16} />
                        Details
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={(e) => handleDeleteCourse(course._id, e)}
                      >
                        <Trash size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                &lt;
              </button>
              
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              
              <button 
                className="page-btn" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Course Modal */}
      {showModal && (
        <div className={`modal-overlay ${showModal ? 'active' : ''}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Course</h2>
              <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="courseCode">Course Code</label>
                  <input 
                    type="text" 
                    id="courseCode" 
                    placeholder="e.g. CS 101" 
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="courseStatus">Status</label>
                  <select 
                    id="courseStatus" 
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="courseTitle">Course Title</label>
                <input 
                  type="text" 
                  id="courseTitle" 
                  placeholder="e.g. Introduction to Programming" 
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="courseInstructor">Instructor</label>
                <input 
                  type="text" 
                  id="courseInstructor" 
                  placeholder="e.g. Dr. Jane Smith" 
                  value={formData.instructor}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="courseStudents">Number of Students</label>
                  <input 
                    type="number" 
                    id="courseStudents" 
                    placeholder="e.g. 30" 
                    value={formData.students}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="courseDuration">Duration</label>
                  <input 
                    type="text" 
                    id="courseDuration" 
                    placeholder="e.g. 16 weeks" 
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="courseDescription">Description</label>
                <textarea 
                  id="courseDescription" 
                  placeholder="Provide a brief description of the course..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              
              <button type="submit" className="submit-btn">
                <Plus size={18} />
                Add Course
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Success Toast Notification */}
      {showToast && (
        <div className="toast success">
          <div className="toast-icon">✓</div>
          <div className="toast-content">
            <div className="toast-title">Success</div>
            <div className="toast-message">{toastMessage}</div>
          </div>
          <div className="toast-close" onClick={() => setShowToast(false)}>×</div>
        </div>
      )}
    </div>
  );
};

export default Courses;