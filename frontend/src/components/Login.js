// src/components/Login.jsx
import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Modal from './Modal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      // Store user data in localStorage for session management
      localStorage.setItem('email', data.user.email);
      localStorage.setItem('name', data.user.name);
      
      setModalMessage('Login successful! Redirecting you to the dashboard...');
      setModalType('success');
      setShowModal(true);

      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (error) {
      console.error('Error logging in:', error.message);
      setModalMessage(error.message === 'User not found' || error.message === 'Invalid password' ? 
        'Invalid email or password. Please try again.' : error.message);
      setModalType('error');
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <Navbar />
      <Modal show={showModal} handleClose={handleCloseModal} message={modalMessage} type={modalType} />
      <div className="login-page">
        {/* Background circles */}
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
        <div className="bg-circle"></div>
        
        <div className="login-outer-container">
          <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-sign-in-header">
                <h2>Sign In</h2>
              </div>
              <div className="login-form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="login-form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="login-button" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="login-forgot-password">
                <a href="/Signup">Don't have an account? Sign Up</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;