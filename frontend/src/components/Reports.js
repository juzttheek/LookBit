import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Calendar, Clock, Users, UserCheck, UserX, AlertTriangle,
  Download, Filter, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import './Reports.css';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const AttendanceReports = () => {

  const navigate = useNavigate();
  const reportContentRef = useRef(null);
  
  // Function to handle navigation back to home
  const handleBackToHome = () => {
    navigate('/home'); // Navigate to the home route
  };

  // State for data
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [courseData, setCourseData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [todayStats, setTodayStats] = useState({
    totalAttendance: { rate: 0, change: 0 },
    presentToday: { count: 0, change: 0 },
    absentToday: { count: 0, change: 0 },
    lateToday: { count: 0, change: 0 }
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const rowsPerPage = 5;

  // Filter state
  const [activeFilter, setActiveFilter] = useState('all');
  const [startDate, setStartDate] = useState('2025-03-01');
  const [endDate, setEndDate] = useState('2025-03-22');
  
  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // Fetch student data when page or filter changes
  useEffect(() => {
    fetchStudentData();
  }, [currentPage, activeFilter]);
  
  // Fetch all reports data
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWeeklyData(),
        fetchMonthlyData(),
        fetchCourseData(),
        fetchStudentData(),
        fetchTodayStats(),
        fetchAlerts()
      ]);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch weekly attendance data
  const fetchWeeklyData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/weekly');
      if (!response.ok) throw new Error('Failed to fetch weekly data');
      
      const data = await response.json();
      setWeeklyData(data.weeklyData);
    } catch (err) {
      console.error('Error fetching weekly data:', err);
      throw err;
    }
  };
  
  // Fetch monthly attendance data
  const fetchMonthlyData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/monthly');
      if (!response.ok) throw new Error('Failed to fetch monthly data');
      
      const data = await response.json();
      setMonthlyData(data.monthlyData);
    } catch (err) {
      console.error('Error fetching monthly data:', err);
      throw err;
    }
  };
  
  // Fetch course attendance data
  const fetchCourseData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/courses');
      if (!response.ok) throw new Error('Failed to fetch course data');
      
      const data = await response.json();
      setCourseData(data.courseData);
    } catch (err) {
      console.error('Error fetching course data:', err);
      throw err;
    }
  };
  
  // Fetch student attendance data with pagination and filtering
  const fetchStudentData = async () => {
    try {
      const courseParam = activeFilter !== 'all' ? `&course=${activeFilter}` : '';
      const response = await fetch(
        `http://localhost:5000/api/reports/students?page=${currentPage}&perPage=${rowsPerPage}${courseParam}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch student data');
      
      const data = await response.json();
      setStudentData(data.students);
      setTotalPages(data.pagination.totalPages);
      setTotalStudents(data.pagination.totalStudents);
    } catch (err) {
      console.error('Error fetching student data:', err);
      throw err;
    }
  };
  
  // Fetch today's attendance statistics
  const fetchTodayStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/today');
      if (!response.ok) throw new Error('Failed to fetch today\'s stats');
      
      const data = await response.json();
      setTodayStats(data);
    } catch (err) {
      console.error('Error fetching today\'s stats:', err);
      throw err;
    }
  };
  
  // Fetch attendance alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      throw err;
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchData();
  };
  
  // Handle date range change
  const handleDateRangeChange = async () => {
    // This would fetch data for the selected date range
    try {
      const response = await fetch(
        `http://localhost:5000/api/reports/date-range?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch date range data');
      
      // Process the data as needed
      // This is just a placeholder - you would need to update the relevant state values
      const data = await response.json();
      console.log('Date range data:', data);
      
      // Refetch other relevant data
      fetchData();
    } catch (err) {
      console.error('Error fetching date range data:', err);
      setError('Failed to fetch data for the selected date range');
    }
  };
  
  // Handle export button click - Export attendance report as PDF
  const handleExport = async () => {
    try {
      setExportingPdf(true);
      
      // Create a temporary div for exporting that clones the report content
      const reportContent = reportContentRef.current;
      if (!reportContent) {
        throw new Error('Report content not found');
      }

      // A4 size in pixels at 96 DPI (approximately)
      const pdfWidth = 210; // mm
      const pdfHeight = 297; // mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add the title
      pdf.setFontSize(18);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Attendance Report', 20, 20);
      
      // Add date range
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Report Period: ${startDate} to ${endDate}`, 20, 30);
      
      let verticalOffset = 40;
      
      // Convert each section to image and add to PDF
      // Stats section
      const statsSection = document.querySelector('.stats-section');
      if (statsSection) {
        const canvas = await html2canvas(statsSection, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate the width to maintain aspect ratio
        const imgWidth = pdfWidth - 40; // 20mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 20, verticalOffset, imgWidth, imgHeight);
        verticalOffset += imgHeight + 10;
        
        // Add a page if we're near the bottom
        if (verticalOffset > pdfHeight - 50) {
          pdf.addPage();
          verticalOffset = 20;
        }
      }
      
      // Weekly attendance chart
      const weeklyChart = document.querySelector('.chart-section');
      if (weeklyChart) {
        const canvas = await html2canvas(weeklyChart, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        
        const imgWidth = pdfWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 20, verticalOffset, imgWidth, imgHeight);
        verticalOffset += imgHeight + 10;
        
        if (verticalOffset > pdfHeight - 50) {
          pdf.addPage();
          verticalOffset = 20;
        }
      }
      
      // Detailed stats
      const detailedStats = document.querySelector('.detailed-stats-section');
      if (detailedStats) {
        const canvas = await html2canvas(detailedStats, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        
        const imgWidth = pdfWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 20, verticalOffset, imgWidth, imgHeight);
        verticalOffset += imgHeight + 10;
        
        if (verticalOffset > pdfHeight - 50) {
          pdf.addPage();
          verticalOffset = 20;
        }
      }
      
      // Student attendance table
      const tableSection = document.querySelector('.table-section');
      if (tableSection) {
        // Find just the table, not the pagination
        const tableOnly = tableSection.querySelector('.attendance-table');
        
        if (tableOnly) {
          const canvas = await html2canvas(tableOnly, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });
          const imgData = canvas.toDataURL('image/png');
          
          const imgWidth = pdfWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 20, verticalOffset, imgWidth, imgHeight);
        }
      }
      
      // Generate the filename with current date
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      const filename = `Attendance_Report_${dateString}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };
  
  // If there's an error, show an error message
  if (error) {
    return (
      <div className="reports-container">
        <div className="error-message">
          <AlertTriangle size={24} />
          <p>{error}</p>
          <button onClick={fetchData} className="reports-button">
            <RefreshCw size={18} />
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="reports-container">
      {/* Background elements */}
      <div className="reports-bg-circle"></div>
      <div className="reports-bg-circle"></div>
      <div className="reports-bg-circle"></div>
      
      <div className="reports-content-wrapper">
        {/* Top back button - using the CSS class that's defined in the CSS file */}
        {/*<button className="top-back-button" onClick={handleBackToHome}>
          <span>←</span> Back
        </button>*/}

<header className="reports-header">
  <div className="reports-title-area">
    <button className="reports-back-button" onClick={handleBackToHome}>
    ← Back
    </button>
    <h1 className="reports-title">Attendance Reports</h1>
  </div>
  <div className="reports-actions">
    <button className="reports-button" onClick={handleExport} disabled={exportingPdf}>
      <Download size={18} />
      {exportingPdf ? 'Generating PDF...' : 'Export Report'}
    </button>
    <button className="reports-button" onClick={handleRefresh}>
      <RefreshCw size={18} />
      Refresh Data
    </button>
  </div>
</header>
        
        <main className="reports-main-content" ref={reportContentRef}>
          {/* Date and filter controls - More compact layout */}
          <div className="controls-section">
            <div className="date-controls">
              <div className="date-range-picker">
                <label>Date Range:</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    className="date-input" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="date-separator">to</span>
                  <input 
                    type="date" 
                    className="date-input" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <button className="reports-button" onClick={handleDateRangeChange}>Apply</button>
                </div>
              </div>
              
              <div className="course-filter">
                <button 
                  className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All Courses
                </button>
                {courseData.slice(0, 3).map((course, index) => (
                  <button 
                    key={index}
                    className={`filter-button ${activeFilter === course.name ? 'active' : ''}`}
                    onClick={() => setActiveFilter(course.name)}
                  >
                    {course.name}
                  </button>
                ))}
                {courseData.length > 3 && (
                  <button className="filter-button">
                    <Filter size={16} />
                    More
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Alert banner */}
          {alerts.length > 0 && (
            <div className="alert-banner warning">
              <AlertTriangle size={20} />
              <p>{alerts[0].message}</p>
              {alerts.length > 1 && (
                <span className="more-alerts">+{alerts.length - 1} more alerts</span>
              )}
            </div>
          )}
          
          {/* Stat cards */}
          <div className="stats-section">
            <div className="stat-cards-grid">
              <div className="stat-card">
                <h3><Users size={20} /> Total Attendance</h3>
                <div className="stat-value percentage">{todayStats.totalAttendance.rate}%</div>
                <div className={`stat-change ${todayStats.totalAttendance.change >= 0 ? 'positive' : 'negative'}`}>
                  <span>{todayStats.totalAttendance.change >= 0 ? '↑' : '↓'}</span> 
                  {Math.abs(todayStats.totalAttendance.change)}% from last week
                </div>
              </div>
              
              <div className="stat-card">
                <h3><UserCheck size={20} /> Present Today</h3>
                <div className="stat-value">{todayStats.presentToday.count}</div>
                <div className={`stat-change ${todayStats.presentToday.change >= 0 ? 'positive' : 'negative'}`}>
                  <span>{todayStats.presentToday.change >= 0 ? '↑' : '↓'}</span> 
                  {Math.abs(todayStats.presentToday.change)} {Math.abs(todayStats.presentToday.change) === 1 ? 'more' : 'more'} than yesterday
                </div>
              </div>
              
              <div className="stat-card">
                <h3><UserX size={20} /> Absent Today</h3>
                <div className="stat-value">{todayStats.absentToday.count}</div>
                <div className={`stat-change ${todayStats.absentToday.change <= 0 ? 'positive' : 'negative'}`}>
                  <span>{todayStats.absentToday.change <= 0 ? '↓' : '↑'}</span> 
                  {Math.abs(todayStats.absentToday.change)} {Math.abs(todayStats.absentToday.change) === 1 ? 'fewer' : 'more'} than yesterday
                </div>
              </div>
              
              <div className="stat-card">
                <h3><Clock size={20} /> Late Arrivals Today</h3>
                <div className="stat-value">{todayStats.lateToday.count}</div>
                <div className={`stat-change ${todayStats.lateToday.change <= 0 ? 'positive' : 'negative'}`}>
                  <span>{todayStats.lateToday.change <= 0 ? '↓' : '↑'}</span> 
                  {Math.abs(todayStats.lateToday.change)} {Math.abs(todayStats.lateToday.change) === 1 ? 'fewer' : 'more'} than yesterday
                </div>
              </div>
            </div>
          </div>
          
          {/* Weekly attendance chart - Fixed height and responsiveness */}
          <div className="chart-section">
            <h2 className="section-title">
              <Calendar size={22} />
              Weekly Attendance Trends
            </h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#e0e0e0" />
                  <YAxis stroke="#e0e0e0" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(28, 30, 44, 0.95)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#e0e0e0'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="attendance" name="Attendance %" fill="#4776e6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent %" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Two column layout for detailed stats - Improved responsiveness */}
          <div className="detailed-stats-section">
            <div className="detailed-stats">
              <div className="detailed-chart-container">
                <h2 className="section-title">Monthly Trends</h2>
                <div className="chart-container small-chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#e0e0e0" />
                      <YAxis stroke="#e0e0e0" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(28, 30, 44, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#e0e0e0'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendance" 
                        name="Attendance %" 
                        stroke="#8e54e9" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="detailed-chart-container">
                <h2 className="section-title">Attendance by Course</h2>
                <div className="chart-container small-chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={courseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#e0e0e0" />
                      <YAxis stroke="#e0e0e0" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(28, 30, 44, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#e0e0e0'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="attendance" 
                        name="Attendance %" 
                        stroke="#7f7fd5" 
                        fill="url(#colorAttendance)" 
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7f7fd5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#7f7fd5" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          {/* Student attendance table - Improved layout and scrolling */}
          <div className="table-section">
            <h2 className="section-title">Student Attendance Details</h2>
            <div className="attendance-table-container">
              <div className="attendance-table">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Today's Status</th>
                      <th>Days Present</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentData.length > 0 ? (
                      studentData.map(student => (
                        <tr key={student.id}>
                          <td>{student.name}</td>
                          <td>{student.course}</td>
                          <td>
                            <span className={`status-badge ${student.status}`}>
                              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                            </span>
                          </td>
                          <td>{student.days}</td>
                          <td>{student.percentage}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-table-message">No student data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="attendance-pagination">
                <div className="pagination-info">
                  Showing {studentData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, totalStudents)} of {totalStudents} students
                </div>
                <div className="pagination-controls">
                  <button 
                    className="pagination-button" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      // Show all pages if 5 or fewer
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      // At beginning, show first 5 pages
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // At end, show last 5 pages
                      pageNum = totalPages - 4 + i;
                    } else {
                      // In middle, show current page and 2 pages on each side
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    className="pagination-button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Remove the duplicate settings-home-button that was at the bottom */}
      </div>
    </div>
  );
};

export default AttendanceReports;