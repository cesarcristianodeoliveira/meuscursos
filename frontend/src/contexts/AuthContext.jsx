import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { client } from '../client'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoizamos a função para evitar re-renderizações infinitas no useEffect
  const fetchUser = useCallback(async (userId) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Buscamos os campos atualizados do Sanity
      const userData = await client.fetch(
        `*[_type == "user" && _id == $userId][0]`, 
        { userId }
      );
      
      if (userData) {
        setUser(userData);
      } else {
        // Se o ID no localStorage não existe mais no Sanity, limpamos
        localStorage.removeItem('userId');
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar usuário do Sanity:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efeito para carregar o usuário ao iniciar o App
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      fetchUser(savedUserId);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = (userData) => {
    if (!userData?._id) return;
    setUser(userData);
    localStorage.setItem('userId', userData._id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  const refreshUser = useCallback(() => {
    const currentId = user?._id || localStorage.getItem('userId');
    if (currentId) {
      fetchUser(currentId);
    }
  }, [user?._id, fetchUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      login, 
      logout, 
      refreshUser 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);