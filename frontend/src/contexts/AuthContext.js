// D:\meuscursos\frontend\src\contexts\AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode'; // Certifique-se de que jwt-decode está instalado

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(localStorage.getItem('userToken'));
  // user agora armazena o objeto completo do usuário, não apenas o token decodificado
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  // Função auxiliar para definir o estado do usuário e token, e salvar no localStorage
  const setAuthData = (token, userData) => {
    try {
      // Verifica a expiração do token ao definir
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn('Token JWT expirado. Realizando logout.');
        logout();
        return;
      }

      setUserToken(token);
      setUser(userData); // Define o objeto user completo
      localStorage.setItem('userToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao processar dados de autenticação:', error);
      logout(); // Logout em caso de erro na decodificação ou processamento
    }
  };

  // Efeito para carregar o usuário e token do localStorage no carregamento inicial
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const storedUserData = localStorage.getItem('user');

    if (token && storedUserData) {
      // Ao carregar, verifique e defina o userToken e user
      setAuthData(token, JSON.parse(storedUserData));
    } else {
      // Limpa tudo se algo estiver faltando ou inválido
      logout(); 
    }
  }, []); // Este efeito roda apenas uma vez no carregamento inicial

  // O useEffect abaixo não é mais estritamente necessário para userToken pois setAuthData já cuida
  // Mas se você tiver outras lógicas que dependem apenas da mudança de userToken separadamente, pode manter.
  // No entanto, para simplicidade e evitar redundância com setAuthData, podemos remover.
  // Eu o comentei por enquanto.
  /*
  useEffect(() => {
    if (userToken) {
      localStorage.setItem('userToken', userToken);
    } else {
      localStorage.removeItem('userToken');
    }
  }, [userToken]);
  */

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
        // Usa a nova função setAuthData para definir token e usuário completo
        setAuthData(data.token, data.user); 
        return { success: true, message: data.message };
      } else {
        // Retorna a mensagem de erro específica do backend
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
        // Usa a nova função setAuthData para definir token e usuário completo
        setAuthData(data.token, data.user); 
        return { success: true, message: data.message, user: data.user, token: data.token };
      } else {
        // Retorna a mensagem de erro específica do backend
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
    setUser(null); // Garante que o user também seja nullificado
  };

  const authContextValue = {
    user, // O objeto user completo
    userToken,
    isAuthenticated: !!userToken, // Depende do userToken
    login,
    register,
    logout,
    // Se você precisar atualizar o usuário em outros lugares, pode expor uma função para isso:
    // setUserData: setAuthData // Opcional, dependendo da sua necessidade
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