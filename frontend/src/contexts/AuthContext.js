// D:\meuscursos\frontend\src\contexts\AuthContext.js

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(localStorage.getItem('userToken'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  // *** ALTERADO: isLoading agora é apenas para o carregamento inicial do contexto ***
  const [isLoadingAuthInitial, setIsLoadingAuthInitial] = useState(true); 

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  const logout = useCallback(() => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    setUserToken(null);
    setUser(null);
  }, []);

  const setAuthData = useCallback((token, userData) => {
    try {
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn('Token JWT expirado. Realizando logout.');
        logout();
        return;
      }
      setUserToken(token);
      setUser(userData);
      localStorage.setItem('userToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao processar dados de autenticação:', error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const storedUserData = localStorage.getItem('user');

    if (token && storedUserData) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 < Date.now()) {
          console.warn('Token JWT expirado no carregamento inicial.');
          logout();
        } else {
          setUserToken(token);
          setUser(JSON.parse(storedUserData));
        }
      } catch (error) {
        console.error('Erro ao decodificar token no carregamento inicial:', error);
        logout();
      }
    } else {
      logout();
    }
    // *** MUITO IMPORTANTE: Define isLoadingAuthInitial como false APÓS a verificação inicial ***
    setIsLoadingAuthInitial(false); 
  }, [logout]); 

  // Removed setIsLoading(true/false) from login/register
  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setAuthData(data.token, data.user);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Erro no login.' };
      }
    } catch (error) {
      console.error('Erro na requisição de login:', error);
      return { success: false, message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  }, [API_BASE_URL, setAuthData]);

  const register = useCallback(async (name, email, password, theme = 'system') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, theme }),
      });
      const data = await response.json();
      if (response.ok) {
        setAuthData(data.token, data.user);
        return { success: true, message: data.message, user: data.user, token: data.token };
      } else {
        return { success: false, message: data.message || 'Erro no registro.' };
      }
    } catch (error) {
      console.error('Erro na requisição de registro:', error);
      return { success: false, message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  }, [API_BASE_URL, setAuthData]);

  const authContextValue = {
    user,
    userToken,
    isAuthenticated: !!userToken,
    login,
    register,
    logout,
    isLoadingAuthInitial, // *** NOVO NOME: Exponha o estado de carregamento INICIAL ***
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};