// D:\meuscursos\frontend\src\contexts\AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode'; // Importe jwt-decode para decodificar o token JWT

// 1. Crie o Contexto
export const AuthContext = createContext(null);

// 2. Crie o Provider do Contexto
export const AuthProvider = ({ children }) => {
  // Estado para armazenar o token JWT e as informações do usuário
  const [userToken, setUserToken] = useState(localStorage.getItem('userToken'));
  const [user, setUser] = useState(null); // Aqui armazenaremos o objeto de usuário completo

  // Acessa a URL base do backend das variáveis de ambiente
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  // Efeito para carregar o usuário do localStorage quando o componente é montado
  // ou quando o userToken muda. Isso garante que o estado do usuário persista entre recargas.
  useEffect(() => {
    if (userToken) {
      try {
        const decodedToken = jwtDecode(userToken);
        
        // Verifica se o token expirou
        if (decodedToken.exp * 1000 < Date.now()) {
          console.warn('Token JWT expirado. Realizando logout.');
          logout(); // Se o token expirou, forçamos o logout
          return;
        }

        // Se o token é válido e não expirou, tenta carregar os dados do usuário do localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser)); // Define o objeto de usuário completo no estado
        } else {
          // Cenário: Token presente, mas dados do usuário não estão no localStorage.
          // Isso pode acontecer se o localStorage for manipulado manualmente ou em algumas situações de cache.
          // Em um aplicativo mais robusto, você faria uma requisição ao backend aqui
          // para buscar os dados do usuário com base no ID do token.
          console.warn('Token presente, mas dados do usuário não encontrados no localStorage. Isso pode indicar um problema.');
          // Exemplo de como buscar os dados (requer um endpoint no backend para isso):
          // fetchUserProfile(decodedToken.id);
        }
      } catch (error) {
        console.error('Erro ao decodificar ou validar token:', error);
        logout(); // Token inválido (malformado, etc.), faz logout para limpar
      }
    } else {
      // Se não há token, garante que o estado do usuário e o localStorage estejam limpos
      setUser(null); 
      localStorage.removeItem('user'); 
    }
  }, [userToken]); // Este efeito roda sempre que 'userToken' muda

  // Função para lidar com o login do usuário
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
        // Salva o token JWT e o objeto de usuário completo no localStorage
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); 
        // Atualiza os estados locais, o que irá disparar o useEffect para revalidar
        setUserToken(data.token); 
        setUser(data.user);       
        return { success: true, message: data.message };
      } else {
        // Retorna a mensagem de erro do backend ou uma padrão
        return { success: false, message: data.message || 'Erro no login.' };
      }
    } catch (error) {
      console.error('Erro na requisição de login:', error);
      return { success: false, message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  };

  // Função para lidar com o registro de um novo usuário
  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // No registro, apenas indicamos sucesso e a mensagem do backend.
        // O login é um passo separado que o usuário fará em seguida.
        return { success: true, message: data.message, user: data.user, token: data.token };
      } else {
        // Retorna a mensagem de erro do backend ou uma padrão
        return { success: false, message: data.message || 'Erro no registro.' };
      }
    } catch (error) {
      console.error('Erro na requisição de registro:', error);
      return { success: false, message: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  };

  // Função para lidar com o logout do usuário
  const logout = () => {
    localStorage.removeItem('userToken'); // Remove o token do localStorage
    localStorage.removeItem('user');     // Remove os dados do usuário do localStorage
    setUserToken(null);                  // Limpa o estado do token
    setUser(null);                       // Limpa o estado do usuário
  };

  // Valor que será fornecido pelo contexto a todos os componentes filhos
  const authContextValue = {
    user, // Objeto com os dados do usuário logado
    userToken, // O token JWT
    isAuthenticated: !!userToken, // Booleano: true se houver um token válido, false caso contrário
    login,     // Função para login
    register,  // Função para registro
    logout,    // Função para logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children} {/* Renderiza os componentes filhos */}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o consumo do contexto em qualquer componente
export const useAuth = () => {
  // Retorna o valor do contexto, permitindo que componentes acessem user, isAuthenticated, login, etc.
  return useContext(AuthContext);
};