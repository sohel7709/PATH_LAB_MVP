import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  LockClosedIcon, 
  ArrowLeftIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
import '../../styles/AuthPage.css';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Trigger animations after component mounts
    setMounted(true);
    
    // Focus the password input after a short delay
    const timer = setTimeout(() => {
      const passwordInput = document.getElementById('password-input');
      if (passwordInput) passwordInput.focus();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Basic validation
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Both fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess('Your password has been reset successfully. You can now login with your new password.');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle navigation back to login
  const handleBackToLogin = () => {
    navigate('/login');
  };
  
  return (
    <div className="forgot-password-container">
      <div className="forms-container">
        <div className="signin-signup">
          {/* Reset Password Form */}
          <form className="sign-in-form" onSubmit={handleSubmit}>
            <h2 className={`title transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Reset Your Password
            </h2>
            
            <p className={`mb-6 text-center text-gray-600 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Enter your new password below.
            </p>
            
            {error && (
              <div className="error-message-container">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <p className="error-message">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="success-message-container bg-green-100 text-green-800 p-4 rounded-lg mb-4 flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <p>{success}</p>
              </div>
            )}
            
            <div className={`input-field transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <i><LockClosedIcon className="h-5 w-5" /></i>
              <input 
                id="password-input"
                type="password" 
                name="password"
                placeholder="New Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <div className={`input-field transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <i><LockClosedIcon className="h-5 w-5" /></i>
              <input 
                type="password" 
                name="confirmPassword"
                placeholder="Confirm New Password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className={`btn solid transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
            
            <div className={`mt-6 text-center transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <button 
                onClick={handleBackToLogin}
                className="flex items-center justify-center text-blue-600 hover:text-blue-800 border-none bg-transparent cursor-pointer"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="panels-container">
        <div className="panel left-panel">
          <div className={`content transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h3>Create New Password</h3>
            <p>Choose a strong password that you don't use for other websites.</p>
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

export default ResetPasswordPage;
