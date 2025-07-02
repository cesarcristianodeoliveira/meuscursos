// D:\meuscursos\frontend\src\contexts\AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(localStorage.getItem('userToken'));
  const [user, setUser] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  // Função auxiliar para carregar e definir o usuário
  const loadUserFromStorage = (token, userData) => {
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
      console.error('Erro ao decodificar ou validar token:', error);
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const storedUserData = localStorage.getItem('user');

    if (token && storedUserData) {
      loadUserFromStorage(token, JSON.parse(storedUserData));
    } else {
      setUserToken(null);
      setUser(null);
      localStorage.removeItem('userToken');
      localStorage.removeItem('user');
    }
  }, []); // Este efeito roda apenas uma vez no carregamento inicial

  // Atualiza o userToken no localStorage quando ele muda no estado
  useEffect(() => {
    if (userToken) {
      localStorage.setItem('userToken', userToken);
    } else {
      localStorage.removeItem('userToken');
    }
  }, [userToken]);


  const login = async (email, password) => {
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
        // Usa a função auxiliar para definir token e usuário
        loadUserFromStorage(data.token, data.user); 
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Erro no login.' };
      }
    } catch (error) {
      console.error('Erro na requisição de login:', error);
      return { success: false, message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  };

  // Alterações aqui: agora aceita 'theme' e, em sucesso, também loga o usuário
  const register = async (name, email, password, theme = 'system') => { 
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, theme }), // Enviando o campo 'theme'
      });

      const data = await response.json();

      if (response.ok) {
        // Se o registro foi bem-sucedido, automaticamente logamos o usuário
        // Usamos a função auxiliar para definir token e usuário
        loadUserFromStorage(data.token, data.user); 
        return { success: true, message: data.message, user: data.user, token: data.token };
      } else {
        return { success: false, message: data.message || 'Erro no registro.' };
      }
    } catch (error) {
      console.error('Erro na requisição de registro:', error);
      return { success: false, message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    setUserToken(null);
    setUser(null);
  };

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