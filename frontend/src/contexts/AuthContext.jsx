import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoização para configurar o token no Axios e LocalStorage
  const setSession = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  // Função para buscar dados atualizados do usuário (Vital para v1.3)
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      // Se o erro for 401 (não autorizado), desloga
      if (error.response?.status === 401) signOut();
    }
    return null;
  }, []);

  useEffect(() => {
    async function loadStorageData() {
      const storageToken = localStorage.getItem('token');

      if (storageToken) {
        setSession(storageToken);
        await refreshUser(); // Usa a função de refresh para carregar o perfil inicial
      }
      
      setLoading(false);
    }
    loadStorageData();
  }, [setSession, refreshUser]);

  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        setSession(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.data.error || "Dados inválidos." };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || "Erro ao conectar com o servidor." 
      };
    }
  };

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
  }, [setSession]);

  return (
    <AuthContext.Provider 
      value={{ 
        signed: !!user, 
        user, 
        loading, 
        signIn, 
        signOut, 
        refreshUser // Exportado para atualizar XP/Créditos após gerar cursos
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