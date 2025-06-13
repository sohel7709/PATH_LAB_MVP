import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { 
  UserIcon, 
  EnvelopeIcon, 
  BuildingOfficeIcon, 
  LockClosedIcon, 
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    labName: '',
    role: 'admin' // Default role for new registrations
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setMounted(true);
    
    // Focus the name input after a short delay
    const timer = setTimeout(() => {
      const nameInput = document.getElementById('name');
      if (nameInput) nameInput.focus();
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

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual registration logic with API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          labName: formData.labName,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Registration successful, redirect to login
      navigate('/login', { 
        state: { message: 'Registration successful! Please sign in.' }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className={`text-3xl sm:text-4xl font-bold text-gray-800 mb-6 transition-all duration-700 ease-in-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        Create an account
      </h1>

      <form 
        className="space-y-5 flex-grow" 
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
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              className="input-field pl-10 py-3 w-full rounded-lg"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-150 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className="input-field pl-10 py-3 w-full rounded-lg"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-200 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="labName"
              name="labName"
              type="text"
              required
              placeholder="Laboratory name"
              value={formData.labName}
              onChange={handleChange}
              className="input-field pl-10 py-3 w-full rounded-lg"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-250 ease-in-out ${
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
              autoComplete="new-password"
              required
              placeholder="Password (min. 8 characters)"
              value={formData.password}
              onChange={handleChange}
              className="input-field pl-10 py-3 w-full rounded-lg"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-300 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field pl-10 py-3 w-full rounded-lg"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-350 ease-in-out ${
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
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating account...
              </>
            ) : (
              <>
                REGISTER
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <div className={`text-xs text-center text-gray-600 transition-all duration-500 delay-400 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </form>
    </div>
  );
}
