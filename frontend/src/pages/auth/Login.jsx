import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../../context/AuthContext';
import { UserIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setMounted(true);
    
    // Focus the email input after a short delay
    const timer = setTimeout(() => {
      const emailInput = document.getElementById('email');
      if (emailInput) emailInput.focus();
    }, 500);
    
    return () => clearTimeout(timer);
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
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className={`text-3xl sm:text-4xl font-bold text-gray-800 mb-6 transition-all duration-700 ease-in-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        Login
      </h1>

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
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
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
              <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
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
              className="input-field pl-10 py-4 w-full rounded-lg"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-200 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
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
              className="input-field pl-10 py-4 w-full rounded-lg"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-300 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
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
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
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
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1"
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
