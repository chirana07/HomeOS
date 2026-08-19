import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    currency: 'LKR',
    dietary_preferences: [],
    household_size: 4,
    monthly_budget: 15000.0
  });
  const [token, setToken] = useState(localStorage.getItem('homeos_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    } else {
      // Default demo state
      setUser({ id: 1, email: 'admin@homeos.ai', full_name: 'Commercial Admin' });
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.preferences) setPreferences(data.preferences);
      } else {
        // Fallback demo user
        setUser({ id: 1, email: 'admin@homeos.ai', full_name: 'Commercial Admin' });
      }
    } catch (e) {
      console.warn("Auth check warning, using demo mode", e);
      setUser({ id: 1, email: 'admin@homeos.ai', full_name: 'Commercial Admin' });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('homeos_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Login failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (email, full_name, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('homeos_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Registration failed' };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('homeos_token');
    setToken(null);
    setUser(null);
  };

  const updatePreferences = async (newPref) => {
    const updated = { ...preferences, ...newPref };
    setPreferences(updated);
    if (token) {
      try {
        await fetch('/api/auth/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updated)
        });
      } catch (e) {
        console.error("Preferences sync error", e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, preferences, loading, login, register, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
