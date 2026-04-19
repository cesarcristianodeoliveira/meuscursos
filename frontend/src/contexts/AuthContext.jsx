import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalização robusta do usuário para garantir que o _id do Sanity esteja sempre presente
  const handleUserResponse = useCallback((userData) => {
    if (!userData) return null;
    
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id 
    };
    
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  // Função para configurar ou limpar a sessão e os headers da API
  const setSession = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
    // Limpamos possíveis estados residuais no localStorage se necessário
    // localStorage.clear(); // Use com cautela se tiver outras preferências salvas
  }, [setSession]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        return handleUserResponse(response.data.user);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        signOut();
      }
      return null;
    }
  }, [signOut, handleUserResponse]);

  // CONFIGURAÇÃO DOS INTERCEPTORES (O "Pulo do Gato")
  // Isso garante que se qualquer requisição no app der 401, o AuthContext deslogue o usuário na hora
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          signOut();
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [signOut]);

  // Carregamento inicial do estado de autenticação
  useEffect(() => {
    async function loadStorageData() {
      const storageToken = localStorage.getItem('token');
      
      if (storageToken) {
        setSession(storageToken);
        await refreshUser(); 
      }
      
      setLoading(false);
    }
    loadStorageData();
  }, [setSession, refreshUser]);

  const signIn = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        setSession(token);
        handleUserResponse(userData);
        return { success: true };
      }
      return { success: false, error: response.data.error || "Dados inválidos." };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || "Erro ao conectar com o servidor." 
      };
    }
  }, [setSession, handleUserResponse]);

  const signUp = useCallback(async (name, email, password, newsletter) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, newsletter });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        setSession(token);
        handleUserResponse(userData);
        return { success: true };
      }
      return { success: false, error: response.data.error || "Erro ao criar conta." };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || "Erro ao conectar com o servidor." 
      };
    }
  }, [setSession, handleUserResponse]);

  return (
    <AuthContext.Provider 
      value={{ 
        signed: !!user, 
        user, 
        authLoading: loading, 
        signIn, 
        signOut, 
        signUp,
        refreshUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};