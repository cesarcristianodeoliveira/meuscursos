import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { client } from '../client'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Busca dados frescos do usuário no Sanity
   * Focado em XP, Créditos e Status do Plano
   */
  const fetchUser = useCallback(async (userId) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Buscamos a estrutura completa de stats para garantir o realismo na UI
      const userData = await client.fetch(
        `*[_type == "user" && _id == $userId][0]{
          ...,
          "stats": {
            "totalXp": coalesce(stats.totalXp, 0),
            "coursesCreated": coalesce(stats.coursesCreated, 0),
            "lastLogin": stats.lastLogin,
            "level": coalesce(stats.level, "Iniciante")
          }
        }`, 
        { userId }
      );
      
      if (userData) {
        setUser(userData);
      } else {
        // Se o usuário foi removido do banco, limpamos a sessão local
        localStorage.removeItem('userId');
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Erro AuthContext (fetchUser):", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Efeito de Inicialização e Real-time Sync
   */
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    let subscription = null;

    if (savedUserId) {
      fetchUser(savedUserId);

      // --- LISTEN REAL-TIME ---
      // Escuta mudanças no documento do usuário (XP, Créditos via Backend)
      subscription = client
        .listen(`*[_type == "user" && _id == $userId]`, { userId: savedUserId })
        .subscribe((update) => {
          // Se houver uma mutação (update), atualizamos o estado local na hora
          if (update.result) {
            setUser(update.result);
          }
        });
    } else {
      setLoading(false);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchUser]);

  const login = (userData) => {
    if (!userData?._id) return;
    setUser(userData);
    localStorage.setItem('userId', userData._id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    // Limpamos o cache e estados para evitar conflito de dados de outro usuário
    window.location.href = '/'; 
  };

  /**
   * Função manual para forçar atualização (útil após ações críticas)
   */
  const refreshUser = useCallback(async () => {
    const currentId = user?._id || localStorage.getItem('userId');
    if (currentId) {
      await fetchUser(currentId);
    }
  }, [user?._id, fetchUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      login, 
      logout, 
      refreshUser,
      isAuthenticated: !!user && !loading
    }}>
      {/* DICA: Se quiser bloquear a tela enquanto carrega o user inicial:
        {loading ? <SeuComponenteDeLoading /> : children}
      */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);