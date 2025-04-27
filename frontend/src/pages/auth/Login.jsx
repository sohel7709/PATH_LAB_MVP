import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';
import { UserIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import LoadingSpinner, { ButtonLoader, SkeletonLoader } from '../../components/common/LoadingSpinner';

export default function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Simulate page loading
    const pageLoadTimer = setTimeout(() => {
      setPageLoading(false);
    }, 800);
    
    // Trigger animations after component mounts
    setMounted(true);
    
    // Focus the email input after a short delay
    const focusTimer = setTimeout(() => {
      const emailInput = document.getElementById('email');
      if (emailInput) emailInput.focus();
    }, 1000);
    
    return () => {
      clearTimeout(pageLoadTimer);
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

  // Show loading spinner while page is loading
  if (pageLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-xl border border-blue-100 transition-all duration-500 transform hover:shadow-2xl">
        <div className="flex-grow flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" color="blue" text="Loading..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-xl border border-blue-100 transition-all duration-500 transform hover:shadow-2xl">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-500 -m-8 mb-8 rounded-t-2xl">
        <h1 className={`text-3xl sm:text-4xl font-extrabold text-white transition-all duration-700 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          Login
        </h1>
        <p className={`text-base text-blue-100 mt-1 transition-all duration-700 ease-in-out delay-100 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          Sign in to your account to continue
        </p>
      </div>

      <form 
        className="space-y-6 flex-grow" 
        onSubmit={handleSubmit}
      >
        {error && (
          <div className={`rounded-md bg-red-50 p-4 transition-all duration-500 ease-in-out ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className={`transition-all duration-500 delay-100 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Username"
              value={formData.email}
              onChange={handleChange}
              className="block w-full rounded-lg border border-blue-300 pl-10 py-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:border-blue-400"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-200 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="block w-full rounded-lg border border-blue-300 pl-10 py-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:border-blue-400"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-300 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <ButtonLoader text="Logging in..." />
            ) : (
              <>
                LOGIN
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <div className={`text-sm text-center transition-all duration-500 delay-400 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <Link
            to="/forgot-password"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
      </form>

      <div className={`mt-8 text-center transition-all duration-500 delay-500 ease-in-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <p className="text-sm text-gray-600">Or Sign in with social platforms</p>
        <div className="flex justify-center space-x-4 mt-4">
          {['facebook', 'twitter', 'google', 'linkedin'].map((platform) => (
            <button
              key={platform}
              className="w-10 h-10 rounded-full border border-blue-300 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
            >
              <span className="sr-only">Sign in with {platform}</span>
              {platform === 'facebook' && <span className="text-xl">f</span>}
              {platform === 'twitter' && <span className="text-xl">t</span>}
              {platform === 'google' && <span className="text-xl">G</span>}
              {platform === 'linkedin' && <span className="text-xl">in</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
