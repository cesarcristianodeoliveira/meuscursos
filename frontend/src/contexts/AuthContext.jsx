import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../sanityClient'; // Ajuste conforme o seu caminho do client sanity

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do usuário (ex: após login ou refresh)
  const fetchUser = async (userId) => {
    try {
      // Buscamos os campos que definimos no nosso novo Schema
      const userData = await client.fetch(
        `*[_type == "user" && _id == $userId][0]`, 
        { userId }
      );
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  // Simulação de persistência (depois integraremos com Login real)
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      fetchUser(savedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('userId', userData._id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, refreshUser: () => fetchUser(user?._id) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);