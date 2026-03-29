import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { client } from '../client'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados frescos do usuário
  const fetchUser = useCallback(async (userId) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Buscamos campos vitais: créditos, stats (XP/Cursos) e plano
      const userData = await client.fetch(
        `*[_type == "user" && _id == $userId][0]{
          ...,
          stats {
            ...,
            totalXp,
            coursesCreated,
            level
          }
        }`, 
        { userId }
      );
      
      if (userData) {
        setUser(userData);
      } else {
        // Se o ID não existe mais (deletado no Sanity), limpa o local
        localStorage.removeItem('userId');
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar usuário do Sanity:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efeito para carregar o usuário ao iniciar o App
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    
    if (savedUserId) {
      fetchUser(savedUserId);

      // --- OPCIONAL: LISTEN REAL-TIME ---
      // Se você quiser que o XP suba na tela "sozinho" assim que o backend terminar:
      const subscription = client
        .listen(`*[_type == "user" && _id == $userId]`, { userId: savedUserId })
        .subscribe((update) => {
          if (update.result) {
            setUser(update.result);
          }
        });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = (userData) => {
    if (!userData?._id) return;
    setUser(userData);
    localStorage.setItem('userId', userData._id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    // Forçar reload pode ser útil para limpar outros contextos
    window.location.reload(); 
  };

  // Útil para chamar após a geração de um curso no frontend
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
      isAuthenticated: !!user
    }}>
      {/* Removi o {!loading && children} para permitir que o App renderize 
         o esqueleto/loading state se necessário, mas você pode manter se preferir 
         bloquear tudo até o fetch terminar.
      */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);