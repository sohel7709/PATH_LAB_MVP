import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthLogoutHandler } from '../utils/authService'; // Assume authService.js will be created

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Forward declaration for use in useEffect and other functions
  let forceLogoutWithPromptCallback;

  const userInitiatedLogout = () => {
    console.log('User initiated sign out.');
    localStorage.removeItem('token');
    localStorage.removeItem('sessionExpiryClientTimestamp');
    setUser(null);
    navigate('/login'); // Direct navigation to login
  };

  const forceLogoutWithPrompt = (message = 'Your session has ended or is invalid. Please log in again.') => {
    console.log('Forced logout triggered with message:', message);
    
    // Display an alert message. The user clicks "OK" on this alert.
    window.alert(message + "\n\nYou will now be redirected to the login page.");
    
    // After the alert is dismissed, automatically proceed with logout and redirection.
    console.log('Alert dismissed, proceeding with automatic logout and navigation to login.');
    localStorage.removeItem('token');
    localStorage.removeItem('sessionExpiryClientTimestamp');
    setUser(null);
    navigate('/login', { state: { logoutMessage: message } }); 
  };
  forceLogoutWithPromptCallback = forceLogoutWithPrompt; 
  
  useEffect(() => {
    // Register the logout handler with the authService
    setAuthLogoutHandler(forceLogoutWithPrompt);
    // Cleanup on component unmount if necessary, though for a global handler, this might be okay
    // return () => setAuthLogoutHandler(null); 
  }, [forceLogoutWithPrompt]); // Rerun if forceLogoutWithPrompt instance changes (it shouldn't often)


  const checkSessionExpiry = () => {
    const expiryTimestamp = localStorage.getItem('sessionExpiryClientTimestamp');
    if (expiryTimestamp && Date.now() > parseInt(expiryTimestamp, 10)) {
      console.log('Client-side session expired, calling forceLogoutWithPrompt.');
      if (forceLogoutWithPromptCallback) {
        forceLogoutWithPromptCallback('Your session has expired. Please log in again.');
      }
    }
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      checkSessionExpiry(); // Check for client-side expiry first

      // const token = localStorage.getItem('token'); // This line was unused, token is re-checked below
      // If session was expired by checkSessionExpiry, user might be null or logout initiated
      // We need to ensure we don't proceed if logout has occurred.
      // A simple check: if user is already null and loading is false, means logout happened.
      // However, checkAuth is async, so state changes might not be immediate.
      // The most robust way is if forceLogoutWithPrompt sets a flag or if navigation occurs.
      // For now, we rely on token check.

      if (!localStorage.getItem('token')) { // Re-check token as forceLogout might have removed it
        console.log('No token found after potential expiry check.');
        setUser(null); 
        setLoading(false);
        return;
      }


      // It's generally better to have a backend endpoint to verify the token's validity
      // and get up-to-date user info. Parsing token client-side has limitations.
      // For now, we continue with client-side parsing as per existing code.
      try {
        const currentToken = localStorage.getItem('token'); // get current token again
        if (!currentToken) throw new Error("Token removed during auth check");

        const tokenParts = currentToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload on checkAuth:', payload);
          
          setUser({
            id: payload.id,
            role: payload.role,
            lab: payload.lab,
            name: payload.name || 'User'
          });
          console.log('User set from token payload on checkAuth:', payload);
        } else {
          throw new Error('Invalid token format on checkAuth');
        }
      } catch (error) {
        console.log('Token verification failed on checkAuth:', error.message);
        if (forceLogoutWithPromptCallback) {
          forceLogoutWithPromptCallback('Session invalid. Please log in again.'); 
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (forceLogoutWithPromptCallback) {
        forceLogoutWithPromptCallback('An error occurred. Please log in again.'); 
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    checkAuth();
    // Optional: Set up an interval to check session expiry periodically
    // const intervalId = setInterval(checkSessionExpiry, 5 * 60 * 1000); // Check every 5 minutes
    // return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);


  const login = async (email, password) => {
    console.log('Attempting to log in with:', { email, password });
    
    try {
      const { auth } = await import('../utils/api');
      const data = await auth.login({ email, password });
      
      console.log('Login successful, user:', data.user);
      console.log('Token received:', data.token); 
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        localStorage.setItem('sessionExpiryClientTimestamp', (Date.now() + twentyFourHoursInMs).toString());
        console.log('Token and client expiry stored in local storage');
      } else {
        console.log('No token received from the server');
        throw new Error('No token received from the server');
      }

      // !!! IMPORTANT FOR AUTOMATIC LOGOUT ON API ERRORS !!!
      // Your API utility (e.g., in '../utils/api.js', where Axios/fetch is configured)
      // MUST have a global response interceptor. This interceptor should:
      // 1. Check if an API response status is 401 (Unauthorized).
      // 2. If it is 401, it MUST call forceLogoutWithPromptCallback() from this context.
      // Example in comments above the original try/catch block for token parsing.
      
      try {
        const tokenParts = data.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload for setting user and navigation:', payload, 'User role:', payload.role);
          
          const currentUser = {
            id: payload.id,
            role: payload.role,
            lab: payload.lab,
            name: data.user?.name || payload.name || 'User', 
            email: data.user?.email || payload.email,
          };
          setUser(currentUser);
          console.log('User state set:', currentUser);

          const userRole = payload.role;
          console.log('Navigating based on role:', userRole);
          
          setTimeout(() => {
            if (userRole === 'super-admin') {
              navigate('/dashboard/super-admin');
            } else if (userRole === 'admin') {
              navigate('/dashboard/admin');
            } else if (userRole === 'technician') {
              navigate('/dashboard/lab-technician');
            } else {
              navigate('/dashboard'); 
            }
          }, 100);
        } else {
          throw new Error('Invalid token format');
        }
      } catch (error) {
        console.error('Error parsing token for navigation:', error);
        navigate('/dashboard'); 
      }
    } catch (error) {
      console.log('Login failed:', error.message || 'Invalid credentials');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout: userInitiatedLogout,     // For UI elements like "Sign Out" buttons
    forceLogoutWithPrompt,        // For automatic/error-driven logouts (e.g. API interceptor)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };
