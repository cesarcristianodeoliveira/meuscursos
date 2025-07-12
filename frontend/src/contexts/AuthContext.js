// D:\meuscursos\frontend\src\contexts\AuthContext.js

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // Importe useCallback
import { jwtDecode } from 'jwt-decode'; // Certifique-se de que jwt-decode está instalado

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [userToken, setUserToken] = useState(localStorage.getItem('userToken'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  // --- Mover logout para antes de setAuthData e envolvê-la em useCallback ---
  const logout = useCallback(() => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    setUserToken(null);
    setUser(null);
  }, []); // Dependências vazias, pois não depende de props ou estado mutáveis

  // --- Envolver setAuthData em useCallback ---
  const setAuthData = useCallback((token, userData) => {
    try {
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn('Token JWT expirado. Realizando logout.');
        logout(); // 'logout' agora está definida antes de ser chamada aqui
        return;
      }

      setUserToken(token);
      setUser(userData);
      localStorage.setItem('userToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao processar dados de autenticação:', error);
      logout(); // 'logout' agora está definida antes de ser chamada aqui
    }
  }, [logout]); // setAuthData depende de logout, então a incluímos aqui

  // Efeito para carregar o usuário e token do localStorage no carregamento inicial
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const storedUserData = localStorage.getItem('user');

    if (token && storedUserData) {
      setAuthData(token, JSON.parse(storedUserData));
    } else {
      logout();
    }
  }, [setAuthData, logout]); // Dependências adicionadas aqui, mas agora são funções estáveis

  // Envolver login em useCallback
  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
  }, [API_BASE_URL, setAuthData]); // login depende de API_BASE_URL e setAuthData

  // Envolver register em useCallback
  const register = useCallback(async (name, email, password, theme = 'system') => { 
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
  }, [API_BASE_URL, setAuthData]); // register depende de API_BASE_URL e setAuthData


  const authContextValue = {
    user,
    userToken,
    isAuthenticated: !!userToken,
    login,
    register,
    logout,
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