import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data); // includes role
      } catch (error) {
        console.error('Failed to fetch user', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.data.token);
      setToken(data.data.token);
      setUser(data.data); // includes role
    } catch (error) {
      const message = error.response?.data?.message || "Invalid email or password. Please try again.";
      throw new Error(message);
    }
  };

  const signup = async (name, email, password, role = 'MEMBER') => {
    try {
      const { data } = await api.post('/auth/signup', { name, email, password, role });
      localStorage.setItem('token', data.data.token);
      setToken(data.data.token);
      setUser(data.data); // includes role
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed. Please try again.";
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
