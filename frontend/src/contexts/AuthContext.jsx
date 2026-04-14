import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Memoização para configurar o token no Axios e LocalStorage
  const setSession = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  // 2. Função de SignOut (Declarada antes para ser usada como dependência)
  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
  }, [setSession]);

  // 3. Função para buscar dados atualizados do usuário (Vital para v1.3)
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      // Se o erro for 401 (não autorizado), desloga automaticamente
      if (error.response?.status === 401) {
        signOut();
      }
    }
    return null;
  }, [signOut]); // <--- Agora o signOut é uma dependência válida

  // 4. Carregamento inicial dos dados
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

  // 5. Função de SignIn memoizada
  const signIn = useCallback(async (email, password) => {
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
  }, [setSession]);

  // 6. Função de SignUp (Adicionada para consistência)
  const signUp = useCallback(async (name, email, password, newsletter) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, newsletter });
      if (response.data.success) {
        setSession(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.data.error || "Erro ao criar conta." };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || "Erro ao conectar com o servidor." 
      };
    }
  }, [setSession]);

  return (
    <AuthContext.Provider 
      value={{ 
        signed: !!user, 
        user, 
        loading, 
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