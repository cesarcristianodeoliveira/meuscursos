import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          
          // Se o backend enviar dentro de .user ou na raiz (resiliência)
          if (response.data.success) {
            const userData = response.data.user || response.data;
            setUser(userData);
          } else {
            setSession(null);
          }
        } catch (error) {
          console.error("Erro no refresh:", error);
          setSession(null);
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
        setSession(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: "Dados inválidos." };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Erro de conexão." };
    }
  };

  const signOut = () => {
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);