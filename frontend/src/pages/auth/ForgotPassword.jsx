import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
import { EnvelopeIcon, ArrowRightIcon, ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      // Check if we're in development mode (resetUrl is returned)
      if (data.resetUrl) {
        setSuccess(`Development mode: Password reset link generated. Reset URL: ${data.resetUrl}`);
        console.log('Reset URL:', data.resetUrl);
      } else {
        setSuccess('Password reset instructions have been sent to your email.');
      }
      
      setEmail(''); // Clear the form
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4 transition-all duration-700 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className={`text-3xl sm:text-4xl font-bold text-gray-800 mb-3 transition-all duration-700 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          Reset your password
        </h1>
        
        <p className={`text-gray-600 max-w-md mx-auto transition-all duration-500 delay-100 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <form 
        className="space-y-6 flex-grow" 
        onSubmit={handleSubmit}
      >
        {error && (
          <div className={`rounded-lg bg-red-50 border border-red-200 p-4 shadow-sm transition-all duration-500 ease-in-out ${
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

        {success && (
          <div className={`rounded-lg bg-green-50 border border-green-200 p-4 shadow-sm transition-all duration-500 ease-in-out ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                {success.includes('Development mode') ? (
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Development Mode</h3>
                    <p className="mt-1 text-sm text-green-700">Password reset link generated.</p>
                    <div className="mt-2 p-2 bg-green-100 rounded-lg overflow-auto">
                      <code className="text-xs text-green-800 break-all">
                        {success.split('Reset URL: ')[1]}
                      </code>
                    </div>
                    <p className="mt-2 text-xs text-green-700">
                      In production, this link would be sent via email.
                    </p>
                  </div>
                ) : (
                  <h3 className="text-sm font-medium text-green-800">{success}</h3>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={`transition-all duration-500 delay-200 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 py-3.5 w-full rounded-lg border border-gray-300 bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
            />
          </div>
        </div>

        <div className={`transition-all duration-500 delay-300 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3.5 px-4 rounded-lg shadow-md transition-all duration-300 ${
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
                Sending...
              </>
            ) : (
              <>
                Send Reset Instructions
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <div className={`text-sm text-center transition-all duration-500 delay-400 ease-in-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <Link
            to="/login"
            className="inline-flex items-center font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Return to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
