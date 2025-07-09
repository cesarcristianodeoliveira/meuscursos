// D:\meuscursos\frontend\src\contexts\AuthContext.js

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Certifique-se de que jwt-decode está instalado

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(localStorage.getItem('userToken'));
  const [user, setUser] = useState(() => {
    // Inicializa o estado 'user' a partir do localStorage
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  // Função de logout encapsulada em useCallback para otimização
  const logout = useCallback(() => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    setUserToken(null);
    setUser(null);
    console.log('Usuário deslogado.'); // Adicionado log para clareza
  }, []); // Dependências vazias, pois não depende de props ou estado mutáveis

  // Função para definir os dados de autenticação (token e usuário)
  // Encapsulada em useCallback para otimização e estabilidade nas dependências de useEffect
  const setAuthData = useCallback((token, userData) => {
    try {
      // Verifica se o token existe antes de tentar decodificar
      if (!token) {
        console.warn('Token JWT ausente. Realizando logout.');
        logout();
        return;
      }

      const decodedToken = jwtDecode(token);
      // Verifica se o token está expirado
      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn('Token JWT expirado. Realizando logout.');
        logout();
        return;
      }

      // Se o token é válido, define os estados e persiste no localStorage
      setUserToken(token);
      setUser(userData);
      localStorage.setItem('userToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Dados de autenticação definidos e persistidos.'); // Adicionado log para clareza
    } catch (error) {
      console.error('Erro ao processar dados de autenticação (possivelmente token inválido):', error);
      logout(); // Em caso de qualquer erro com o token, força o logout
    }
  }, [logout]); // setAuthData depende de logout, então a incluímos aqui

  // Efeito para carregar e validar o token/usuário do localStorage no carregamento inicial da aplicação
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const storedUserData = localStorage.getItem('user');

    if (token && storedUserData) {
      // Se há dados no localStorage, tenta defini-los e validá-los
      setAuthData(token, JSON.parse(storedUserData));
    } else {
      // Se não há dados completos ou se o token é nulo, garante que o estado esteja limpo
      logout();
    }
  }, [setAuthData, logout]); // Dependências garantem que o efeito roda quando essas funções (estáveis) mudam

  // Função de login, encapsulada em useCallback
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
        setAuthData(data.token, data.user); // Usa setAuthData para gerenciar o token e user
        return { success: true, message: data.message };
      } else {
        // Retorna a mensagem de erro do backend se a resposta não for ok
        return { success: false, message: data.message || 'Erro no login.' };
      }
    } catch (error) {
      console.error('Erro na requisição de login:', error);
      return { success: false, message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  }, [API_BASE_URL, setAuthData]); // login depende de API_BASE_URL e setAuthData

  // Função de registro, encapsulada em useCallback
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
        setAuthData(data.token, data.user); // Usa setAuthData para gerenciar o token e user
        return { success: true, message: data.message, user: data.user, token: data.token };
      } else {
        // Retorna a mensagem de erro do backend se a resposta não for ok
        return { success: false, message: data.message || 'Erro no registro.' };
      }
    } catch (error) {
      console.error('Erro na requisição de registro:', error);
      return { success: false, message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  }, [API_BASE_URL, setAuthData]); // register depende de API_BASE_URL e setAuthData

  // Objeto de valor que será provido para os componentes que usarem o contexto
  const authContextValue = {
    user, // O objeto de usuário logado
    userToken, // O token JWT
    isAuthenticated: !!userToken, // Facilita a verificação de autenticação
    login, // Função para login
    register, // Função para registro
    logout, // Função para logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para consumir o AuthContext de forma mais simples
export const useAuth = () => {
  return useContext(AuthContext);
};