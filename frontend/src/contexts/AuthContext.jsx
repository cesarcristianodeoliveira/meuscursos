import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Injetar o token no axios assim que o Provider for instanciado
  // Isso ajuda a evitar falhas na primeira requisição após o F5
  const storageToken = localStorage.getItem('token');
  if (storageToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${storageToken}`;
  }

  useEffect(() => {
    async function loadStorageData() {
      if (storageToken) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error("Erro na reidratação:", error.message);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false); // Só libera o App após tentar validar
    }
    loadStorageData();
  }, [storageToken]);

  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);