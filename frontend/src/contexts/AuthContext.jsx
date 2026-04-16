import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    localStorage.clear(); // Limpeza completa por segurança
  }, [setSession]);

  const handleUserResponse = useCallback((userData) => {
    if (!userData) return null;
    
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id 
    };
    
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        return handleUserResponse(response.data.user);
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      if (error.response?.status === 401) {
        signOut();
      }
    }
    return null;
  }, [signOut, handleUserResponse]);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storageToken = localStorage.getItem('token');
        
        if (storageToken) {
          setSession(storageToken);
          // Aguardamos a resposta do servidor antes de liberar o loading
          // Isso evita que o App ache que o usuário é null enquanto a API carrega
          await refreshUser(); 
        }
      } catch (error) {
        console.error("Erro no carregamento inicial:", error);
      } finally {
        // Agora sim, com user preenchido ou erro tratado, liberamos a UI
        setLoading(false);
      }
    }
    loadStorageData();
  }, [setSession, refreshUser]);

  const signIn = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        setSession(response.data.token);
        handleUserResponse(response.data.user);
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
        setSession(response.data.token);
        handleUserResponse(response.data.user);
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
        authLoading: loading, // Mantido como solicitado
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