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
        console.log('No token found');
        setLoading(false);
        return;
      }

      // Verify token with backend
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User verified:', data.user);
        setUser(data.user);
      } else {
        console.log('Token verification failed');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('Attempting to log in with:', { email, password }); // Log the login attempt
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
    console.log('Login failed:', data.message || 'Invalid credentials');

      throw new Error(data.message || 'Login failed');
    }

    console.log('Login successful, user:', data.user);
    console.log('Token received:', data.token); // Log the token received
    if (data.token) {
      localStorage.setItem('token', data.token); // Store the token in local storage
    console.log('Token stored in local storage'); // Log when token is successfully stored

    } else {
    console.log('No token received from the server'); // Log if no token is received




    }

    setUser(data.user);
    await checkAuth(); // Ensure user state is updated after login
    const userRole = data.user.role; // Assuming the user object contains a role property
    if (userRole === 'super-admin') {
      navigate('/dashboard/super-admin');
    } else if (userRole === 'admin') {
      navigate('/dashboard/admin');
    } else if (userRole === 'lab-technician') {
      navigate('/dashboard/lab-technician');
    } else {
      navigate('/'); // Fallback if role is not recognized
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
