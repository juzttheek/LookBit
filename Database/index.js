require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const helmet = require('helmet');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet());

// MongoDB connection setup
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Nodemailer setup for sending emails
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Student Schema
const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  course: { type: String, required: true },
  faceData: {
    frontal: { type: String, required: true },
    leftProfile: { type: String },
    rightProfile: { type: String },
    upwardTilt: { type: String },
    downwardTilt: { type: String }
  },
  registrationDate: { type: Date, default: Date.now }
});

const embeddingsSchema = new mongoose.Schema({
  lastUpdated: { type: Date, default: Date.now },
  embeddings: { type: Object, required: true }
});

const attendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  fullName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  time: { type: String, required: true },
  course: { type: String, required: true }
});

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['active', 'upcoming', 'completed'], default: 'active' },
  students: { type: Number, required: true },
  duration: { type: String, required: true },
  progress: { type: Number, default: 0 }
});

const adminSettingsSchema = new mongoose.Schema({
  adminId: { type: String, required: true, unique: true }, // Could link to User model
  permissions: {
    manageUsers: { type: Boolean, default: true },
    viewReports: { type: Boolean, default: true },
    editSettings: { type: Boolean, default: true }
  },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false }
  },
  securityOptions: {
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 } // Minutes
  },
  lastUpdated: { type: Date, default: Date.now }
});

const studentSettingsSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  course: { type: String, required: true },
  notificationsEmail: { type: Boolean, default: true },
  notificationsPush: { type: Boolean, default: true },
  notificationsSMS: { type: Boolean, default: false },
  faceDataUploaded: { type: Boolean, default: true },
  faceDataLastUpdated: { type: String, default: '2024-12-15' },
  attendanceAlerts: { type: Boolean, default: true },
  manualCheckInAllowed: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: { type: String, default: '00:00:00 0000-00-00' },
  lastLogout: { type: String, default: null } // Optional: to track logout time
});

const StudentSettings = mongoose.model('StudentSettings', studentSettingsSchema);
const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
const Course = mongoose.model('Course', courseSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Embeddings = mongoose.model('Embeddings', embeddingsSchema);
const Student = mongoose.model('Student', studentSchema);
const User = mongoose.model('User', userSchema);

// Route to sign up a new user
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      lastLogin: '00:00:00 0000-00-00'
    });

    await newUser.save();

    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p>Thank you for creating an account on our platform.</p>
          <p>Your account has been successfully created and you can now sign in using your email and password.</p>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #777;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending welcome email:', error.message);
      } else {
        console.log('Welcome email sent:', info.response);
      }
    });

    res.status(201).json({ message: 'User created successfully.' });

  } catch (error) {
    console.error('Error signing up:', error.message);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

// Route to log in a user using email and password
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Update lastLogin with the current date and time
    user.lastLogin = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
    await user.save();

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// Route to register a new student with face data
app.post('/api/students/register', async (req, res) => {
  try {
    const { 
      studentId, 
      fullName, 
      email, 
      course, 
      semester, 
      section, 
      faceData 
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student ID already registered' });
    }

    // Create new student
    const newStudent = new Student({
      studentId,
      fullName,
      email,
      course,
      semester,
      section,
      faceData
    });

    await newStudent.save();

    res.status(201).json({ 
      message: 'Student registered successfully',
      student: {
        id: newStudent._id,
        studentId: newStudent.studentId,
        fullName: newStudent.fullName,
        email: newStudent.email
      }
    });

  } catch (error) {
    console.error('Error registering student:', error.message);
    res.status(500).json({ error: 'Failed to register student' });
  }
});

// Route to check if a student ID already exists (optional but useful)
app.get('/api/students/check/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ studentId });
    
    res.status(200).json({ exists: !!student });
  } catch (error) {
    console.error('Error checking student ID:', error.message);
    res.status(500).json({ error: 'Failed to check student ID' });
  }
});

// Route to get all students for embedding generation
app.get('/api/students/all', async (req, res) => {
  try {
    const students = await Student.find({});
    
    const formattedStudents = students.map(student => ({
      personName: student.studentId,
      images: [
        {
          personName: student.studentId,
          imageName: 'frontal.jpg',
          imageData: student.faceData.frontal
        },
        // Include other angles if available
        student.faceData.leftProfile && {
          personName: student.studentId,
          imageName: 'left.jpg',
          imageData: student.faceData.leftProfile
        },
        student.faceData.rightProfile && {
          personName: student.studentId,
          imageName: 'right.jpg',
          imageData: student.faceData.rightProfile
        },
        student.faceData.upwardTilt && {
          personName: student.studentId,
          imageName: 'up.jpg',
          imageData: student.faceData.upwardTilt
        },
        student.faceData.downwardTilt && {
          personName: student.studentId,
          imageName: 'down.jpg',
          imageData: student.faceData.downwardTilt
        }
      ].filter(Boolean) // Remove null entries
    }));
    
    res.status(200).json({ students: formattedStudents });
  } catch (error) {
    console.error('Error fetching students:', error.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Route to save embeddings to database
app.post('/api/embeddings/save', async (req, res) => {
  try {
    const { embeddings } = req.body;
    
    if (!embeddings) {
      return res.status(400).json({ error: 'No embeddings provided' });
    }
    
    // Check if embeddings document exists
    let embeddingsDoc = await Embeddings.findOne({});
    
    if (embeddingsDoc) {
      // Update existing embeddings
      embeddingsDoc.embeddings = embeddings;
      embeddingsDoc.lastUpdated = Date.now();
      await embeddingsDoc.save();
    } else {
      // Create new embeddings document
      embeddingsDoc = new Embeddings({
        embeddings: embeddings,
        lastUpdated: Date.now()
      });
      await embeddingsDoc.save();
    }
    
    res.status(200).json({ 
      message: 'Embeddings saved successfully',
      lastUpdated: embeddingsDoc.lastUpdated
    });
  } catch (error) {
    console.error('Error saving embeddings:', error.message);
    res.status(500).json({ error: 'Failed to save embeddings' });
  }
});

// Route to get latest embeddings
app.get('/api/embeddings/latest', async (req, res) => {
  try {
    const embeddingsDoc = await Embeddings.findOne({}).sort({ lastUpdated: -1 });
    
    if (!embeddingsDoc) {
      return res.status(404).json({ error: 'No embeddings found' });
    }
    
    res.status(200).json({
      embeddings: embeddingsDoc.embeddings,
      lastUpdated: embeddingsDoc.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching embeddings:', error.message);
    res.status(500).json({ error: 'Failed to fetch embeddings' });
  }
});

// Route to mark student attendance
app.post('/api/attendance/mark', async (req, res) => {
  try {
    const { studentId, time } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }
    
    // Check if student exists
    const student = await Student.findOne({ studentId });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Check if attendance already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingAttendance = await Attendance.findOne({
      studentId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    if (existingAttendance) {
      return res.status(400).json({
        error: 'Attendance already marked for today',
        attendanceRecord: existingAttendance
      });
    }
    
    // Create new attendance record
    const newAttendance = new Attendance({
      studentId: student.studentId,
      fullName: student.fullName,
      time: time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      course: student.course,
      semester: student.semester,
      section: student.section
    });
    
    await newAttendance.save();
    
    res.status(201).json({
      message: 'Attendance marked successfully',
      attendanceRecord: newAttendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error.message);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Route to get attendance records for a specific date
app.get('/api/attendance/date/:date', async (req, res) => {
  try {
    const dateParam = req.params.date;
    const queryDate = dateParam ? new Date(dateParam) : new Date();
    
    // Set time to beginning of day
    queryDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const attendanceRecords = await Attendance.find({
      date: {
        $gte: queryDate,
        $lt: nextDay
      }
    }).sort({ time: 1 });
    
    // Get total number of students for calculating statistics
    const totalStudents = await Student.countDocuments({});
    const presentStudents = attendanceRecords.length;
    const absentStudents = totalStudents - presentStudents;
    const attendanceRate = totalStudents > 0 
      ? Math.round((presentStudents / totalStudents) * 100) 
      : 0;
    
    res.status(200).json({
      records: attendanceRecords,
      stats: {
        totalStudents,
        presentStudents,
        absentStudents,
        attendanceRate
      },
      date: queryDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error.message);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Route to get weekly attendance statistics
app.get('/api/reports/weekly', async (req, res) => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];
    
    // Get the date for the start of the current week (Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get total number of students for calculating percentages
    const totalStudents = await Student.countDocuments({});
    
    // Loop through each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      // Get attendance for this day
      const attendanceCount = await Attendance.countDocuments({
        date: {
          $gte: date,
          $lt: nextDay
        }
      });
      
      const presentPercentage = totalStudents > 0 
        ? Math.round((attendanceCount / totalStudents) * 100) 
        : 0;
      
      const absentPercentage = 100 - presentPercentage;
      
      weeklyData.push({
        name: days[i],
        attendance: presentPercentage,
        absent: absentPercentage,
        date: date.toISOString().split('T')[0]
      });
    }
    
    res.status(200).json({ weeklyData });
  } catch (error) {
    console.error('Error fetching weekly attendance:', error.message);
    res.status(500).json({ error: 'Failed to fetch weekly attendance data' });
  }
});

// Route to get monthly attendance statistics
app.get('/api/reports/monthly', async (req, res) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    
    const year = new Date().getFullYear();
    const totalStudents = await Student.countDocuments({});
    
    // Loop through each month
    for (let i = 0; i < 12; i++) {
      const startDate = new Date(year, i, 1);
      const endDate = new Date(year, i + 1, 0);
      
      // Get all attendance records for this month
      const attendanceRecords = await Attendance.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      // Calculate attendance rate based on business days in the month
      // Assuming classes run Monday-Friday
      const businessDays = getBusinessDaysInMonth(year, i);
      const maxPossibleAttendance = totalStudents * businessDays;
      
      // Count unique student-day combinations
      const uniqueAttendance = new Set();
      attendanceRecords.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        uniqueAttendance.add(`${record.studentId}-${dateStr}`);
      });
      
      const attendanceRate = maxPossibleAttendance > 0 
        ? Math.round((uniqueAttendance.size / maxPossibleAttendance) * 100) 
        : 0;
      
      monthlyData.push({
        name: months[i],
        attendance: attendanceRate,
        month: i + 1
      });
    }
    
    res.status(200).json({ monthlyData });
  } catch (error) {
    console.error('Error fetching monthly attendance:', error.message);
    res.status(500).json({ error: 'Failed to fetch monthly attendance data' });
  }
});

// Helper function to calculate business days in a month
function getBusinessDaysInMonth(year, month) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  let businessDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
}

// Route to get attendance statistics by course
app.get('/api/reports/courses', async (req, res) => {
  try {
    // Get all courses from student records
    const courses = await Student.distinct('course');
    const courseData = [];
    
    // For each course, calculate attendance rate
    for (const course of courses) {
      // Get all students in this course
      const studentsInCourse = await Student.find({ course });
      const studentIds = studentsInCourse.map(student => student.studentId);
      
      // Get recent attendance records (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Count attendance records for each student
      const attendanceRecords = await Attendance.find({
        studentId: { $in: studentIds },
        date: { $gte: thirtyDaysAgo }
      });
      
      // Calculate attendance rate
      // Assuming 20 school days in a month
      const maxPossibleAttendance = studentIds.length * 20;
      
      // Count unique student-day combinations
      const uniqueAttendance = new Set();
      attendanceRecords.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        uniqueAttendance.add(`${record.studentId}-${dateStr}`);
      });
      
      const attendanceRate = maxPossibleAttendance > 0 
        ? Math.round((uniqueAttendance.size / maxPossibleAttendance) * 100) 
        : 0;
      
      courseData.push({
        name: course,
        attendance: attendanceRate
      });
    }
    
    res.status(200).json({ courseData });
  } catch (error) {
    console.error('Error fetching course attendance:', error.message);
    res.status(500).json({ error: 'Failed to fetch course attendance data' });
  }
});

// Route to get individual student attendance details with pagination
app.get('/api/reports/students', async (req, res) => {
  try {
    const { page = 1, perPage = 10, course } = req.query;
    const pageNumber = parseInt(page);
    const perPageNumber = parseInt(perPage);
    
    // Base query
    const query = {};
    
    // Add course filter if provided
    if (course && course !== 'all') {
      query.course = course;
    }
    
    // Get total count for pagination
    const totalStudents = await Student.countDocuments(query);
    
    // Get students with pagination
    const students = await Student.find(query)
      .skip((pageNumber - 1) * perPageNumber)
      .limit(perPageNumber);
    
    // Get attendance records for all students
    const studentIds = students.map(student => student.studentId);
    
    // Get attendance for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.find({
      studentId: { $in: studentIds },
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    // Get attendance for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthAttendance = await Attendance.find({
      studentId: { $in: studentIds },
      date: { $gte: thirtyDaysAgo }
    });
    
    // Create attendance map for the last 30 days
    const studentAttendanceMap = {};
    studentIds.forEach(id => {
      studentAttendanceMap[id] = {
        daysPresent: 0,
        totalDays: 20, // Assuming 20 school days in a month
        status: 'absent'
      };
    });
    
    // Count days present for each student
    monthAttendance.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      const key = `${record.studentId}-${dateStr}`;
      
      if (!studentAttendanceMap[record.studentId].daysTracked) {
        studentAttendanceMap[record.studentId].daysTracked = new Set();
      }
      
      studentAttendanceMap[record.studentId].daysTracked.add(dateStr);
    });
    
    // Set today's status for each student
    todayAttendance.forEach(record => {
      studentAttendanceMap[record.studentId].status = 'present';
      
      // Check if the student was late
      const recordTime = record.time.split(':');
      const hours = parseInt(recordTime[0]);
      const minutes = parseInt(recordTime[1]);
      
      // Define "late" as arriving after 9:00 AM
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        studentAttendanceMap[record.studentId].status = 'late';
      }
    });
    
    // Format student data for the frontend
    const studentData = students.map(student => {
      const attendance = studentAttendanceMap[student.studentId];
      const daysPresent = attendance.daysTracked ? attendance.daysTracked.size : 0;
      const percentage = Math.round((daysPresent / attendance.totalDays) * 100);
      
      return {
        id: student.studentId,
        name: student.fullName,
        course: student.course,
        status: attendance.status,
        days: daysPresent,
        percentage: `${percentage}%`
      };
    });
    
    res.status(200).json({
      students: studentData,
      pagination: {
        currentPage: pageNumber,
        perPage: perPageNumber,
        totalStudents,
        totalPages: Math.ceil(totalStudents / perPageNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance details:', error.message);
    res.status(500).json({ error: 'Failed to fetch student attendance details' });
  }
});

// Route to get today's attendance summary
app.get('/api/reports/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
    
    // Get total number of students
    const totalStudents = await Student.countDocuments({});
    
    // Get attendance counts for today
    const todayAttendance = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    // Count present and late students
    const presentToday = todayAttendance.length;
    let lateToday = 0;
    
    todayAttendance.forEach(record => {
      const recordTime = record.time.split(':');
      const hours = parseInt(recordTime[0]);
      const minutes = parseInt(recordTime[1]);
      
      // Define "late" as arriving after 9:00 AM
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        lateToday++;
      }
    });
    
    const absentToday = totalStudents - presentToday;
    
    // Get yesterday's attendance for comparison
    const yesterdayAttendance = await Attendance.find({
      date: {
        $gte: yesterday,
        $lt: today
      }
    });
    
    // Count present and late students for yesterday
    const presentYesterday = yesterdayAttendance.length;
    let lateYesterday = 0;
    
    yesterdayAttendance.forEach(record => {
      const recordTime = record.time.split(':');
      const hours = parseInt(recordTime[0]);
      const minutes = parseInt(recordTime[1]);
      
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        lateYesterday++;
      }
    });
    
    const absentYesterday = totalStudents - presentYesterday;
    
    // Get attendance rate for the week so far
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const weekAttendance = await Attendance.find({
      date: {
        $gte: startOfWeek,
        $lt: tomorrow
      }
    });
    
    // Count unique student-day combinations for the week
    const uniqueWeekAttendance = new Set();
    weekAttendance.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      uniqueWeekAttendance.add(`${record.studentId}-${dateStr}`);
    });
    
    // Calculate the maximum possible attendance for the week so far
    const schoolDaysSoFar = Math.min(dayOfWeek, 5); // Count only Monday-Friday
    const maxPossibleWeekAttendance = totalStudents * schoolDaysSoFar;
    
    const weekAttendanceRate = maxPossibleWeekAttendance > 0 
      ? Math.round((uniqueWeekAttendance.size / maxPossibleWeekAttendance) * 100) 
      : 0;
    
    // Calculate change from last week
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setHours(23, 59, 59, 999);
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    
    const lastWeekAttendance = await Attendance.find({
      date: {
        $gte: startOfLastWeek,
        $lt: startOfWeek
      }
    });
    
    // Count unique student-day combinations for last week
    const uniqueLastWeekAttendance = new Set();
    lastWeekAttendance.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      uniqueLastWeekAttendance.add(`${record.studentId}-${dateStr}`);
    });
    
    const maxPossibleLastWeekAttendance = totalStudents * 5; // Assume 5 school days last week
    
    const lastWeekAttendanceRate = maxPossibleLastWeekAttendance > 0 
      ? Math.round((uniqueLastWeekAttendance.size / maxPossibleLastWeekAttendance) * 100) 
      : 0;
    
    const weekChangeRate = weekAttendanceRate - lastWeekAttendanceRate;
    
    res.status(200).json({
      totalAttendance: {
        rate: weekAttendanceRate,
        change: weekChangeRate
      },
      presentToday: {
        count: presentToday,
        change: presentToday - presentYesterday
      },
      absentToday: {
        count: absentToday,
        change: absentToday - absentYesterday
      },
      lateToday: {
        count: lateToday,
        change: lateToday - lateYesterday
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s attendance summary:', error.message);
    res.status(500).json({ error: 'Failed to fetch today\'s attendance summary' });
  }
});

// Route to check for attendance anomalies/alerts
app.get('/api/reports/alerts', async (req, res) => {
  try {
    const alerts = [];
    
    // Get all courses
    const courses = await Student.distinct('course');
    
    // Check for courses with low attendance this week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    for (const course of courses) {
      // Get students in this course
      const studentsInCourse = await Student.find({ course });
      const studentIds = studentsInCourse.map(student => student.studentId);
      
      if (studentIds.length === 0) continue;
      
      // Get attendance for this course this week
      const weekAttendance = await Attendance.find({
        studentId: { $in: studentIds },
        date: {
          $gte: startOfWeek,
          $lt: tomorrow
        }
      });
      
      // Count unique student-day combinations
      const uniqueAttendance = new Set();
      weekAttendance.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        uniqueAttendance.add(`${record.studentId}-${dateStr}`);
      });
      
      // Calculate the maximum possible attendance for the week so far
      const schoolDaysSoFar = Math.min(dayOfWeek, 5); // Count only Monday-Friday
      const maxPossibleAttendance = studentIds.length * schoolDaysSoFar;
      
      const attendanceRate = maxPossibleAttendance > 0 
        ? Math.round((uniqueAttendance.size / maxPossibleAttendance) * 100) 
        : 0;
      
      // Add alert if attendance is below 80%
      if (attendanceRate < 80) {
        alerts.push({
          type: 'warning',
          message: `Course attendance for ${course} has dropped below ${attendanceRate}% this week. Consider taking action.`
        });
      }
    }
    
    // Check for students with consistently low attendance
    const students = await Student.find({});
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const student of students) {
      // Get attendance records for this student in the last 30 days
      const attendanceRecords = await Attendance.find({
        studentId: student.studentId,
        date: { $gte: thirtyDaysAgo }
      });
      
      // Count unique days
      const uniqueDays = new Set();
      attendanceRecords.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        uniqueDays.add(dateStr);
      });
      
      // Calculate attendance rate (assuming 20 school days in a month)
      const attendanceRate = Math.round((uniqueDays.size / 20) * 100);
      
      // Add alert if student has very low attendance
      if (attendanceRate < 60) {
        alerts.push({
          type: 'danger',
          message: `${student.fullName} has very low attendance (${attendanceRate}%) in the past month.`
        });
      }
    }
    
    res.status(200).json({ alerts });
  } catch (error) {
    console.error('Error checking for alerts:', error.message);
    res.status(500).json({ error: 'Failed to check for attendance alerts' });
  }
});

// Route to get data for date range
app.get('/api/reports/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Get attendance records for the date range
    const attendanceRecords = await Attendance.find({
      date: {
        $gte: start,
        $lte: end
      }
    });
    
    // Count unique student-day combinations
    const uniqueAttendance = new Map();
    
    attendanceRecords.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      const key = `${dateStr}`;
      
      if (!uniqueAttendance.has(key)) {
        uniqueAttendance.set(key, new Set());
      }
      
      uniqueAttendance.get(key).add(record.studentId);
    });
    
    // Get total students count once before mapping
    const totalStudents = await Student.countDocuments({});
    
    // Convert to array of daily records
    const dailyData = Array.from(uniqueAttendance.entries()).map(([date, students]) => {
      const presentStudents = students.size;
      const absentStudents = totalStudents - presentStudents;
      const attendanceRate = totalStudents > 0 
        ? Math.round((presentStudents / totalStudents) * 100) 
        : 0;
      
      return {
        date,
        totalStudents,
        presentStudents,
        absentStudents,
        attendanceRate
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.status(200).json({ dailyData });
  } catch (error) {
    console.error('Error fetching date range data:', error.message);
    res.status(500).json({ error: 'Failed to fetch date range attendance data' });
  }
});

// Route to get all courses with search and pagination
app.get('/api/getcourses', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 6 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const searchQuery = {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ]
    };

    const totalCourses = await Course.countDocuments(searchQuery);
    const courses = await Course.find(searchQuery)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.status(200).json({
      courses,
      pagination: {
        currentPage: pageNumber,
        perPage: limitNumber,
        totalCourses,
        totalPages: Math.ceil(totalCourses / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error.message);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Route to add a new course
app.post('/api/addcourses', async (req, res) => {
  try {
    const { code, title, instructor, description, status, students, duration } = req.body;

    // Validate required fields
    if (!code || !title || !instructor || !description || !students || !duration) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ error: 'Course code already exists' });
    }

    const newCourse = new Course({
      code,
      title,
      instructor,
      description,
      status,
      students,
      duration,
      progress: 0
    });

    await newCourse.save();

    res.status(201).json({
      message: 'Course added successfully',
      course: newCourse
    });
  } catch (error) {
    console.error('Error adding course:', error.message);
    res.status(500).json({ error: 'Failed to add course' });
  }
});

// Get Admin Settings
app.get('/api/settings/admin/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const settings = await AdminSettings.findOne({ adminId });
    if (!settings) {
      return res.status(404).json({ error: 'Admin settings not found' });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin settings' });
  }
});

// Update Admin Settings
app.put('/api/settings/admin/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const updates = req.body;
    const settings = await AdminSettings.findOneAndUpdate(
      { adminId },
      { ...updates, lastUpdated: Date.now() },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Admin settings updated', settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin settings' });
  }
});


// Route to search students by name, email, or studentId
app.get('/api/settings/students/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const students = await Student.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
      ],
    }).limit(10); // Limit results for performance

    res.status(200).json(students);
  } catch (error) {
    console.error('Error searching students:', error.message);
    res.status(500).json({ error: 'Failed to search students' });
  }
});

// Route to get a specific student's details by ID
app.get('/api/settings/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student details:', error.message);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

// Route to update a student's profile
app.put('/api/settings/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const student = await Student.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json({ message: 'Student profile updated successfully', student });
  } catch (error) {
    console.error('Error updating student:', error.message);
    res.status(500).json({ error: 'Failed to update student profile' });
  }
});

// Route to handle logout
app.post('/logout', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for logout' });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update lastLogin to indicate logout (optional, depending on your needs)
    user.lastLogin = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
    await user.save();

    // In a real application, you'd invalidate the session/token here
    // Since this is a simple setup, we'll just return a success message
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error logging out:', error.message);
    res.status(500).json({ error: 'Failed to log out' });
  }
});

app.post('/logout', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for logout' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.lastLogout = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
    await user.save();

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error logging out:', error.message);
    res.status(500).json({ error: 'Failed to log out' });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});