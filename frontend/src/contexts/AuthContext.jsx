import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para configurar o token no Axios
  const setSession = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  useEffect(() => {
    async function loadStorageData() {
      const storageToken = localStorage.getItem('token');

      if (storageToken) {
        setSession(storageToken);
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            setSession(null);
          }
        } catch (error) {
          setSession(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadStorageData();
  }, [setSession]);

  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token, user: userData } = response.data;
        setSession(token);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: "Credenciais inválidas" };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Erro no login" };
    }
  };

  const signOut = () => {
    setSession(null);
    setUser(null);
    window.location.href = '/'; // Garante o reset total da rota "/"
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);