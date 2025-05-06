import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  UserIcon, 
  EnvelopeIcon, 
  BuildingOfficeIcon, 
  LockClosedIcon,
  ShieldCheckIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import '../../styles/AuthPage.css';

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUpMode, setIsSignUpMode] = useState(location.pathname === '/register');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    labName: '',
    password: '',
    confirmPassword: ''
  });
  
  // Error and loading states
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Update sign-up mode based on URL
    setIsSignUpMode(location.pathname === '/register');
  }, [location.pathname]);
  
  // Handle login form input changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle register form input changes
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    // Basic validation
    if (!loginData.email.trim()) {
      setLoginError('Email is required');
      return;
    }
    
    if (!loginData.password.trim()) {
      setLoginError('Password is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the login function from AuthContext
      await login(loginData.email, loginData.password);
      // Navigation is handled in the AuthContext
    } catch (err) {
      setLoginError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };
  
  // Handle register form submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    
    // Basic validation
    if (!registerData.username.trim()) {
      setRegisterError('Username is required');
      return;
    }
    
    if (!registerData.email.trim()) {
      setRegisterError('Email is required');
      return;
    } else if (!isValidEmail(registerData.email)) {
      setRegisterError('Please enter a valid email');
      return;
    }
    
    if (!registerData.labName.trim()) {
      setRegisterError('Laboratory name is required');
      return;
    }
    
    if (!registerData.password) {
      setRegisterError('Password is required');
      return;
    } else if (registerData.password.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Implement actual registration logic with API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerData.username,
          email: registerData.email,
          password: registerData.password,
          labName: registerData.labName,
          role: 'admin' // Default role for new registrations
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Show success message
      showSuccess('Registration successful! Please sign in.');
      
      // Switch to login form after successful registration
      setTimeout(() => {
        setIsSignUpMode(false);
        navigate('/login');
        setRegisterData({
          username: '',
          email: '',
          labName: '',
          password: '',
          confirmPassword: ''
        });
      }, 1500);
    } catch (err) {
      setRegisterError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle between login and register forms
  const toggleMode = (mode) => {
    if (mode === 'signup') {
      setIsSignUpMode(true);
      navigate('/register');
    } else {
      setIsSignUpMode(false);
      navigate('/login');
    }
  };
  
  // Helper function to validate email
  const isValidEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  // Helper function to show success message
  const showSuccess = (message) => {
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerText = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      document.body.removeChild(successDiv);
    }, 3000);
  };
  
  return (
    <div className={`container ${isSignUpMode ? 'sign-up-mode' : ''}`}>
      <div className="forms-container">
        <div className="signin-signup">
          {/* Login Form */}
          <form className="sign-in-form" onSubmit={handleLoginSubmit}>
            <h2 className="title">Login</h2>
            
            {loginError && (
              <div className="error-message-container">
                <p className="error-message">{loginError}</p>
              </div>
            )}
            
            <div className="input-field">
              <i><UserIcon className="h-5 w-5" /></i>
              <input 
                type="email" 
                name="email"
                placeholder="Email" 
                value={loginData.email}
                onChange={handleLoginChange}
                required 
              />
            </div>
            
            <div className="input-field">
              <i><LockClosedIcon className="h-5 w-5" /></i>
              <input 
                type="password" 
                name="password"
                placeholder="Password" 
                value={loginData.password}
                onChange={handleLoginChange}
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="btn solid"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            
            <div className="mt-2 mb-2 text-center">
              <button 
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-blue-600 hover:text-blue-800 border-none bg-transparent cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>
            
            <p className="social-text">Or Sign in with social platforms</p>
            <div className="social-media">
              <a href="#" className="social-icon">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-icon">
                <i className="fab fa-google"></i>
              </a>
              <a href="#" className="social-icon">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </form>

          {/* Registration Form */}
          <form className="sign-up-form" onSubmit={handleRegisterSubmit}>
            <h2 className="title">Register</h2>
            
            {registerError && (
              <div className="error-message-container">
                <p className="error-message">{registerError}</p>
              </div>
            )}
            
            <div className="input-field">
              <i><UserIcon className="h-5 w-5" /></i>
              <input 
                type="text" 
                name="username"
                placeholder="Username" 
                value={registerData.username}
                onChange={handleRegisterChange}
                required 
              />
            </div>
            
            <div className="input-field">
              <i><EnvelopeIcon className="h-5 w-5" /></i>
              <input 
                type="email" 
                name="email"
                placeholder="Email" 
                value={registerData.email}
                onChange={handleRegisterChange}
                required 
              />
            </div>
            
            <div className="input-field">
              <i><BuildingOfficeIcon className="h-5 w-5" /></i>
              <input 
                type="text" 
                name="labName"
                placeholder="Laboratory Name" 
                value={registerData.labName}
                onChange={handleRegisterChange}
                required 
              />
            </div>
            
            <div className="input-field">
              <i><LockClosedIcon className="h-5 w-5" /></i>
              <input 
                type="password" 
                name="password"
                placeholder="Password" 
                value={registerData.password}
                onChange={handleRegisterChange}
                required 
              />
            </div>
            
            <div className="input-field">
              <i><LockClosedIcon className="h-5 w-5" /></i>
              <input 
                type="password" 
                name="confirmPassword"
                placeholder="Confirm Password" 
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="btn"
              disabled={isLoading}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
            
            <p className="social-text">Or Sign up with social platforms</p>
            <div className="social-media">
              <a href="#" className="social-icon">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-icon">
                <i className="fab fa-google"></i>
              </a>
              <a href="#" className="social-icon">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </form>
        </div>
      </div>

      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <h3>New here?</h3>
            <p>Create an account and start your journey with us today!</p>
            <button 
              className="btn transparent" 
              onClick={() => toggleMode('signup')}
            >
              Register
            </button>
          </div>
          <ShieldCheckIcon className="h-24 w-24 text-white" />
        </div>
        
        <div className="panel right-panel">
          <div className="content">
            <h3>One of us?</h3>
            <p>Already have an account? Sign in to access your dashboard!</p>
            <button 
              className="btn transparent" 
              onClick={() => toggleMode('signin')}
            >
              Login
            </button>
          </div>
          <UserPlusIcon className="h-24 w-24 text-white" />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
