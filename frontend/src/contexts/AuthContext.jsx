import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Injeção imediata para evitar falha no primeiro request após F5
  const storageToken = localStorage.getItem('token');
  if (storageToken && !api.defaults.headers.common['Authorization']) {
    api.defaults.headers.common['Authorization'] = `Bearer ${storageToken}`;
  }

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
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            setSession(null);
          }
        } catch (error) {
          console.error("Erro ao validar sessão:", error);
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
        const { token, user: userData } = response.data;
        setSession(token);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: "Verifique suas credenciais." };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Erro no servidor." };
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