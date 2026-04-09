import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * CONFIGURAÇÃO GLOBAL DO TOKEN
   * Salva no localStorage e injeta o header no Axios para todas as futuras requisições.
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
   * Executa ao carregar o app para verificar se o token guardado ainda é válido.
   */
  useEffect(() => {
    async function loadStorageData() {
      const storageToken = localStorage.getItem('token');

      if (storageToken) {
        setSession(storageToken);
        try {
          const response = await api.get('/auth/me');
          
          // O backend agora retorna { success: true, ...userData }
          if (response.data.success) {
            setUser(response.data); 
          } else {
            setSession(null);
          }
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
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        setSession(token);
        setUser(userData);
        return { success: true };
      }
      
      return { success: false, error: "Falha na autenticação." };
    } catch (error) {
      // Captura a mensagem amigável enviada pelo seu authController
      const message = error.response?.data?.error || "E-mail ou senha incorretos.";
      return { success: false, error: message };
    }
  };

  /**
   * 3. REGISTRO (SignUp)
   */
  const signUp = async (name, email, password, newsletter) => {
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        newsletter 
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        setSession(token);
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: "Não foi possível completar o cadastro." };
    } catch (error) {
      // Captura o erro específico (ex: "E-mail já cadastrado") do backend
      const message = error.response?.data?.error || "Erro ao criar conta. Tente novamente.";
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
   * Útil para atualizar XP, Créditos ou Nível sem precisar deslogar/logar.
   */
  const updateStats = (newData) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...newData,
        stats: { ...prev.stats, ...(newData.stats || {}) }
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