// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StartupPage from '../src/components/StartupPage';
import Login from '../src/components/Login';
import Signup from '../src/components/Signup';
import Home from './components/Home';
import Take_Attendance from './components/Take_attendance';
import Student_Registration from './components/Student_Registration';
import Courses from './components/Courses';
import Reports from './components/Reports';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Download, FileText, User, Clock, Filter } from 'lucide-react';
import Settings from './components/Settings';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartupPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/take_attendance" element={<Take_Attendance />} />
        <Route path="/student_registration" element={<Student_Registration />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
       
      </Routes>
    </Router>
  );
};


export default App;
