// src/components/Navbar.jsx
import React from 'react';
import './Navbar.css';
// Import the logo - you'll need to add your actual logo file to your project
import logo from '../components/images/LookBit01.png'; // Update this path to wherever your logo is stored

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Student Attendance System</div>
      <div className="navbar-center">
        <a href="/login" className="nav-link">Login</a>
        <a href="/signup" className="nav-link">Sign Up</a>
      </div>
      <div className="navbar-right">
        <img src={logo} alt="my_logo" className="navbar-logo" />
        <div className="navbar-text">
          <h1>LookBit</h1>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;