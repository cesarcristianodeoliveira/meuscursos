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
  }, [setSession]);

  /**
   * Função para normalizar o usuário e garantir que o _id exista.
   * Usamos um novo objeto para garantir que o React dispare a atualização da UI.
   */
  const handleUserResponse = useCallback((userData) => {
    if (!userData) return null;
    
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.id // Compatibilidade v1.3
    };
    
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  /**
   * REFRESH USER: Busca dados frescos do servidor (Vital para reset de créditos)
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        return handleUserResponse(response.data.user);
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      // Se o token expirou ou é inválido, desloga
      if (error.response?.status === 401) {
        signOut();
      }
    }
    return null;
  }, [signOut, handleUserResponse]);

  useEffect(() => {
    async function loadStorageData() {
      const storageToken = localStorage.getItem('token');
      
      if (storageToken) {
        setSession(storageToken);
        // Ao carregar o app, busca os dados reais do banco (Resetando créditos se necessário)
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
        authLoading: loading, // Nomeado para evitar conflito com loadings de páginas
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