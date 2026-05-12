import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleUserResponse = useCallback((userData) => {
    if (!userData) return null;
    
    // Normalização para garantir que o Front sempre tenha acesso fácil aos dados
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id,
      credits: userData.credits ?? 0,
      xp: userData.stats?.totalXp ?? userData.xp ?? 0,
      level: userData.stats?.level ?? userData.level ?? 1,
      stats: {
        totalXp: userData.stats?.totalXp ?? userData.xp ?? 0,
        level: userData.stats?.level ?? userData.level ?? 1,
        coursesCreated: userData.stats?.coursesCreated ?? 0,
        coursesCompleted: userData.stats?.coursesCompleted ?? 0,
        lastLogin: userData.stats?.lastLogin || new Date().toISOString(),
      }
    };
    
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

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

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        return handleUserResponse(response.data.user);
      }
      return null;
    } catch (error) {
      if (error.response?.status === 401) signOut();
      return null;
    }
  }, [handleUserResponse, signOut]);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storageToken = localStorage.getItem('@IAcademy:token');
        if (storageToken) {
          setSession(storageToken);
          const currentUser = await refreshUser();
          if (!currentUser) signOut();
        }
      } catch (e) {
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
        setSession(response.data.token);
        handleUserResponse(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Falha na conexão." };
    }
  }, [setSession, handleUserResponse]);

  const signUp = useCallback(async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      if (response.data.success) {
        setSession(response.data.token);
        handleUserResponse(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Erro no registro." };
    }
  }, [setSession, handleUserResponse]);

  const authValue = useMemo(() => ({
    signed: !!user,
    user, 
    setUser,
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

export const useAuth = () => useContext(AuthContext);