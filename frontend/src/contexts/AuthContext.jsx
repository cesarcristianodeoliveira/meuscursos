import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * 1. REIDRATAÇÃO DA SESSÃO
   * Roda assim que o App abre. Verifica se há um token e busca os 
   * dados atualizados (XP, Nível, Créditos) no Backend.
   */
  useEffect(() => {
    async function loadStorageData() {
      const storageToken = localStorage.getItem('token');

      if (storageToken) {
        try {
          // Rota /auth/me que revisamos no Backend
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Sessão expirada ou inválida.");
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      // O loading só vira false após a resposta da API ou falha
      setLoading(false);
    }

    loadStorageData();
  }, []);

  /**
   * 2. LOGIN (SignIn)
   * Envia as credenciais e armazena o token e o usuário.
   */
  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Erro ao realizar login.";
      return { success: false, error: message };
    }
  };

  /**
   * 3. REGISTRO (SignUp)
   * Cria a conta e já loga o usuário automaticamente.
   */
  const signUp = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Erro ao criar conta.";
      return { success: false, error: message };
    }
  };

  /**
   * 4. LOGOUT (SignOut)
   * Limpa tudo e volta o estado para nulo.
   */
  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  /**
   * 5. ATUALIZAÇÃO MANUAL DE STATUS
   * Útil para atualizar XP e Créditos após gerar um curso sem dar F5.
   */
  const updateStats = (newStats) => {
    setUser(prev => prev ? { ...prev, stats: { ...prev.stats, ...newStats } } : null);
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

// Hook personalizado para usar o Auth em qualquer componente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}