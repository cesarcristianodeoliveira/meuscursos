import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Normaliza os dados do usuário vindos do Sanity/Backend.
   * Mantém a compatibilidade entre 'xp' e 'stats.totalXp'.
   */
  const handleUserResponse = useCallback((userData) => {
    if (!userData) return null;
    
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id,
      credits: userData.credits ?? 0,
      xp: userData.xp ?? userData.stats?.totalXp ?? 0, // Facilita acesso direto
      stats: {
        totalXp: userData.stats?.totalXp ?? userData.xp ?? 0,
        level: userData.stats?.level ?? userData.level ?? 1,
        coursesCreated: userData.stats?.coursesCreated ?? userData.coursesCreated ?? 0,
        coursesCompleted: userData.stats?.coursesCompleted ?? userData.coursesCompleted ?? 0,
        lastLogin: userData.stats?.lastLogin || new Date().toISOString(),
      }
    };
    
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  /**
   * Gerencia a persistência do Token e cabeçalhos da API
   */
  const setSession = useCallback((token) => {
    if (token) {
      localStorage.setItem('@IAcademy:token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('@IAcademy:token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
  }, [setSession]);

  /**
   * Busca os dados atualizados (XP, Nível, Créditos)
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        return handleUserResponse(response.data.user);
      }
      return null;
    } catch (error) {
      if (error.response?.status === 401) {
        signOut();
      }
      return null;
    }
  }, [handleUserResponse, signOut]);

  /**
   * Inicialização: Carrega token e dados do usuário ao abrir o app
   */
  useEffect(() => {
    async function loadStorageData() {
      try {
        const storageToken = localStorage.getItem('@IAcademy:token');
        
        if (storageToken) {
          setSession(storageToken);
          const currentUser = await refreshUser();
          
          if (!currentUser) {
            signOut();
          }
        }
      } catch (e) {
        console.error("Erro ao carregar sessão:", e);
        signOut();
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, [setSession, refreshUser, signOut]);

  const signIn = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        setSession(token);
        handleUserResponse(userData);
        return { success: true };
      }
      return { success: false, error: response.data.error || "Credenciais incorretas." };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || "Falha na conexão com o servidor." 
      };
    }
  }, [setSession, handleUserResponse]);

  const signUp = useCallback(async ({ name, email, password, newsletter }) => {
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
        error: error.response?.data?.error || "Erro no registro. Tente novamente." 
      };
    }
  }, [setSession, handleUserResponse]);

  // Adicionado 'setUser' ao value para permitir atualizações manuais de outros contextos
  const authValue = useMemo(() => ({
    signed: !!user,
    user, 
    setUser, // <--- ADICIONADO AQUI
    authLoading: loading, 
    signIn, 
    signOut, 
    signUp,
    refreshUser 
  }), [user, loading, signIn, signOut, signUp, refreshUser]);

  return (
    <AuthContext.Provider value={authValue}>
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