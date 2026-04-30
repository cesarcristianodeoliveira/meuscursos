import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Normaliza os dados do usuário vindos do Sanity/Backend.
   * Garante que campos de Gamificação (XP/Level) sempre existam.
   */
  const handleUserResponse = useCallback((userData) => {
    if (!userData) return null;
    
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id,
      credits: userData.credits ?? 0,
      // Blindagem dos dados de XP e Progresso
      stats: {
        totalXp: userData.stats?.totalXp ?? 0,
        level: userData.stats?.level ?? 1,
        coursesCreated: userData.stats?.coursesCreated ?? 0,
        coursesCompleted: userData.stats?.coursesCompleted ?? 0,
        ...(userData.stats || {})
      }
    };
    
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  /**
   * Configura o Header global da API e o LocalStorage.
   */
  const setSession = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.removeItem('@IAcademy:token'); // Migração concluída
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('@IAcademy:token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
  }, [setSession]);

  /**
   * Busca os dados mais recentes do usuário (XP, Créditos, etc).
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        return handleUserResponse(response.data.user);
      }
    } catch (error) {
      // Se o token for inválido, desloga o usuário
      if (error.response?.status === 401) {
        signOut();
      }
      return null;
    }
  }, [handleUserResponse, signOut]);

  /**
   * LOAD STORAGE: Inicialização do App
   */
  useEffect(() => {
    async function loadStorageData() {
      const storageToken = localStorage.getItem('token') || localStorage.getItem('@IAcademy:token');
      
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
      return { success: false, error: response.data.error || "E-mail ou senha incorretos." };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || "Erro de conexão com o servidor." 
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
        error: error.response?.data?.error || "Erro ao processar registro." 
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
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};