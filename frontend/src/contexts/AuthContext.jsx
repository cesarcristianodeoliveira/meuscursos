import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * CONFIGURAÇÃO GLOBAL DO TOKEN
   * Garante que todas as chamadas à API levem o token se ele existir.
   */
  const setSession = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  /**
   * 1. REIDRATAÇÃO DA SESSÃO
   */
  useEffect(() => {
    async function loadStorageData() {
      const storageToken = localStorage.getItem('token');

      if (storageToken) {
        setSession(storageToken); // Configura o cabeçalho da API
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Sessão expirada ou inválida.");
          setSession(null);
          setUser(null);
        }
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  /**
   * 2. LOGIN (SignIn)
   */
  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      setSession(token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Erro ao realizar login.";
      return { success: false, error: message };
    }
  };

  /**
   * 3. REGISTRO (SignUp)
   * Agora recebe o 'plan' vindo do formulário.
   */
  const signUp = async (name, email, password, plan) => {
    try {
      // Enviando o plano escolhido para o Backend
      const response = await api.post('/auth/register', { name, email, password, plan });
      const { token, user: userData } = response.data;

      setSession(token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Erro ao criar conta.";
      return { success: false, error: message };
    }
  };

  /**
   * 4. LOGOUT (SignOut)
   */
  const signOut = () => {
    setSession(null);
    setUser(null);
  };

  /**
   * 5. ATUALIZAÇÃO MANUAL DE STATUS
   * Atualiza créditos ou XP sem precisar de novo login.
   */
  const updateStats = (newData) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...newData, // Atualiza créditos/plano se vierem na raiz
        stats: { ...prev.stats, ...(newData.stats || {}) } // Atualiza XP/Level
      };
    });
  };

  return (
    <AuthContext.Provider 
      value={{ 
        signed: !!user, 
        user, 
        loading, 
        signIn, 
        signUp, 
        signOut,
        updateStats 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}