// This file is no longer used directly. The App.jsx now imports ForgotPassword.jsx directly.
// Keeping this file for reference or future use.

import { useState, useEffect } from 'react';
import ForgotPassword from './ForgotPassword';
import '../../styles/AuthPage.css';
import { KeyIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Trigger animations after component mounts
    setMounted(true);
  }, []);
  
  // Handle navigation back to login
  const handleBackToLogin = () => {
    navigate('/login');
  };
  
  return (
    <div className="forgot-password-container">
      <div className="forms-container">
        <div className="signin-signup">
          {/* Use the ForgotPassword component */}
          <div className="sign-in-form">
            <ForgotPassword />
          </div>
        </div>
      </div>

      <div className="panels-container">
        <div className="panel left-panel">
          <div className={`content transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h3>Password Recovery</h3>
            <p>We'll help you get back into your account safely and securely.</p>
            <button 
              onClick={handleBackToLogin}
              className="btn transparent"
            >
              Back to Login
            </button>
          </div>
          <KeyIcon className={`h-24 w-24 text-white transition-all duration-700 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
