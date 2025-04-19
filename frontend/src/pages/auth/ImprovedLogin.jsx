import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  UserIcon, 
  LockClosedIcon, 
  ArrowRightIcon, 
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

export default function ImprovedLogin() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setMounted(true);
    
    // Focus the email input after a short delay
    const focusTimer = setTimeout(() => {
      const emailInput = document.getElementById('email');
      if (emailInput) emailInput.focus();
    }, 500);
    
    return () => {
      clearTimeout(focusTimer);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use the login function from AuthContext
      await login(formData.email, formData.password);
      // Navigation is handled in the AuthContext
    } catch (err) {
      // Check for specific error code from backend middleware
      if (err.response?.data?.errorCode === 'LAB_INACTIVE_OR_SUSPENDED') {
        setError(err.response.data.message); // Use the specific message from backend
      } else {
        setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.'); // More specific fallback
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-6xl flex rounded-2xl shadow-2xl overflow-hidden bg-white">
        {/* Left side - Illustration */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-800 p-12 flex-col justify-center items-center text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="max-w-md relative z-10">
            <div className="flex items-center mb-6">
              <BeakerIcon className="h-10 w-10 mr-3 text-blue-200" />
              <h2 className="text-3xl font-bold">Pathology Lab Manager</h2>
            </div>
            
            <div className="mb-8 flex justify-center">
              {/* Enhanced Lab illustration */}
              <svg width="280" height="220" viewBox="0 0 280 220" className="w-full max-w-xs">
                {/* Background circle */}
                <circle cx="140" cy="110" r="80" fill="rgba(255,255,255,0.1)" />
                
                {/* Microscope - enhanced */}
                <rect x="120" y="135" width="50" height="10" rx="2" fill="#60A5FA"/>
                <rect x="135" y="145" width="20" height="5" rx="1" fill="#3B82F6"/>
                <rect x="140" y="150" width="10" height="20" rx="1" fill="#2563EB"/>
                <rect x="140" y="85" width="10" height="50" rx="1" fill="#3B82F6"/>
                <ellipse cx="145" cy="80" rx="15" ry="10" fill="#60A5FA"/>
                <ellipse cx="145" cy="80" rx="10" ry="6" fill="#93C5FD"/>
                <ellipse cx="145" cy="80" rx="5" ry="3" fill="#DBEAFE"/>
                <rect x="140" y="60" width="10" height="20" rx="2" fill="#2563EB"/>
                <ellipse cx="145" cy="60" rx="7" ry="2" fill="#1D4ED8"/>
                
                {/* Lab flask left - with liquid animation */}
                <path d="M85,150 L75,120 L75,110 L95,110 L95,120 L85,150 Z" fill="#93C5FD" opacity="0.8">
                  <animate attributeName="d" values="M85,150 L75,120 L75,110 L95,110 L95,120 L85,150 Z;M85,150 L75,120 L75,110 L95,110 L95,120 L85,150 Z;M85,150 L73,120 L75,110 L95,110 L97,120 L85,150 Z;M85,150 L75,120 L75,110 L95,110 L95,120 L85,150 Z" dur="3s" repeatCount="indefinite" />
                </path>
                <rect x="75" y="105" width="20" height="5" rx="2" fill="#60A5FA"/>
                <ellipse cx="85" cy="105" rx="10" ry="2" fill="#3B82F6"/>
                
                {/* Lab flask right - with liquid animation */}
                <path d="M195,150 L185,120 L185,110 L205,110 L205,120 L195,150 Z" fill="#BFDBFE" opacity="0.8">
                  <animate attributeName="d" values="M195,150 L185,120 L185,110 L205,110 L205,120 L195,150 Z;M195,150 L187,120 L185,110 L205,110 L203,120 L195,150 Z;M195,150 L185,120 L185,110 L205,110 L205,120 L195,150 Z;M195,150 L183,120 L185,110 L205,110 L207,120 L195,150 Z" dur="4s" repeatCount="indefinite" />
                </path>
                <rect x="185" y="105" width="20" height="5" rx="2" fill="#60A5FA"/>
                <ellipse cx="195" cy="105" rx="10" ry="2" fill="#3B82F6"/>
                
                {/* Test tubes with bubbling animation */}
                <rect x="60" y="125" width="7" height="35" rx="3.5" fill="#93C5FD" opacity="0.9"/>
                <circle cx="63.5" cy="150" r="1.5" fill="white" opacity="0.6">
                  <animate attributeName="cy" values="150;140;130" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.8;0" dur="2s" repeatCount="indefinite" />
                </circle>
                
                <rect x="72" y="130" width="7" height="30" rx="3.5" fill="#60A5FA" opacity="0.9"/>
                <circle cx="75.5" cy="155" r="1.5" fill="white" opacity="0.6">
                  <animate attributeName="cy" values="155;145;135" dur="1.7s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.8;0" dur="1.7s" repeatCount="indefinite" />
                </circle>
                
                <rect x="84" y="135" width="7" height="25" rx="3.5" fill="#3B82F6" opacity="0.9"/>
                <circle cx="87.5" cy="155" r="1.5" fill="white" opacity="0.6">
                  <animate attributeName="cy" values="155;145;140" dur="2.3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.8;0" dur="2.3s" repeatCount="indefinite" />
                </circle>
                
                {/* Test tube rack */}
                <rect x="55" y="160" width="42" height="5" rx="1" fill="#1D4ED8"/>
                <rect x="55" y="165" width="42" height="5" rx="1" fill="#1E40AF"/>
              </svg>
            </div>
            
            <div className="space-y-4">
              <p className="text-blue-100 text-lg">
                Streamline your laboratory operations with our comprehensive management solution.
              </p>
              
              <ul className="space-y-2 text-blue-100">
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Efficient patient management
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Customizable test templates
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Professional report generation
                </li>
              </ul>
            </div>
            
            <div className="mt-8 flex space-x-4">
              <div className="h-2 w-2 rounded-full bg-blue-200 animate-pulse"></div>
              <div className="h-2 w-2 rounded-full bg-blue-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className={`w-full md:w-1/2 p-8 md:p-12 transition-all duration-500 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="max-w-md mx-auto">
            <div className="text-center md:text-left mb-10">
              <img src="/logo.svg" alt="Pathology Lab" className="h-12 w-auto mb-6 mx-auto md:mx-0" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm">
                <div className="flex">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white shadow-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white shadow-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium text-base"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                  <span className="sr-only">Sign in with Google</span>
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                </button>

                <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                  <span className="sr-only">Sign in with Facebook</span>
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </button>

                <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                  <span className="sr-only">Sign in with LinkedIn</span>
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-gray-600">
              © {new Date().getFullYear()} Pathology Lab. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
