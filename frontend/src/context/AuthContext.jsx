import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
                setLoading(false);
        return;
      }

      try {
        // Parse the token to get user information
        // This is a temporary solution until the backend verify endpoint is fixed
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
                    
          // Set user from token payload
          setUser({
            id: payload.id,
            role: payload.role,
            lab: payload.lab,
            name: payload.name || 'User' // Add name from token payload
          });
          
                  } else {
          throw new Error('Invalid token format');
        }
      } catch (error) {
                localStorage.removeItem('token');
      }
    } catch (error) {
            localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
// Log the login attempt
    
    try {
      // Import the API utility
      const { auth } = await import('../utils/api');
      
      // Use the API utility to login
      const data = await auth.login({ email, password });
      
      // Log the token received
      
      if (data.token) {
        localStorage.setItem('token', data.token); // Store the token in local storage
// Log when token is successfully stored
      } else {
// Log if no token is received
        throw new Error('No token received from the server');
      }

      // Parse token to get role information and set user state
      try {
        const tokenParts = data.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
                    
          // Set user state based primarily on token payload, merging other data
          const currentUser = {
            id: payload.id,
            role: payload.role,
            lab: payload.lab,
            // Merge other relevant fields from data.user if needed, ensuring payload takes precedence for core fields
            name: data.user?.name || payload.name || 'User', 
            email: data.user?.email || payload.email,
            // Add other fields from data.user as necessary
          };
          setUser(currentUser);
          
          // Navigate based on role from token
          const userRole = payload.role;
                    
          // Use setTimeout to ensure the user state is updated before navigation
          setTimeout(() => {
            if (userRole === 'super-admin') {
                            navigate('/dashboard/super-admin');
            } else if (userRole === 'admin') {
                            navigate('/dashboard/admin');
            } else if (userRole === 'technician') {
                            navigate('/dashboard/lab-technician');
            } else {
                            navigate('/dashboard'); // Fallback if role is not recognized
            }
          }, 100);
        } else {
          throw new Error('Invalid token format');
        }
      } catch (error) {
                navigate('/dashboard'); // Fallback to dashboard
      }
    } catch (error) {
            throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Define the hook first, then export it
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the hook
export { useAuth };
