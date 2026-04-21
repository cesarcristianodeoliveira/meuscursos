import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { client } from '../client'; 
import api from '../services/api';     
import { useAuth } from './AuthContext';

const CourseContext = createContext();

export const COURSES_PER_PAGE = 6;

export const CourseProvider = ({ children }) => {
  const { refreshUser, user } = useAuth(); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [categories, setCategories] = useState(['Recentes']);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  /**
   * 1. BUSCA DADOS GLOBAIS (Stats e Categorias)
   * Usado para popular o Dashboard e filtros de busca.
   */
  const fetchGlobalData = useCallback(async (force = false) => {
    if (initialDataLoaded && !force) return;

    try {
      const query = `{
        "stats": {
          "courses": count(*[_type == "course"]),
          "categories": count(*[_type == "category"]),
          "lessons": count(*[_type == "course"].modules[].lessons[]),
          "quizzes": count(*[_type == "course"].modules[].exercises[])
        },
        "cats": *[_type == "category"].title
      }`;

      const data = await client.fetch(query);
      
      // Limpa títulos nulos e ordena alfabeticamente
      const sortedCats = [
        'Recentes', 
        ...(data.cats || [])
          .filter(c => c && c.trim() !== '')
          .sort((a, b) => a.localeCompare(b))
      ];

      setStats(data.stats);
      setCategories(sortedCats);
      setInitialDataLoaded(true);
    } catch (err) {
      console.error("❌ Erro ao buscar estatísticas globais:", err);
    }
  }, [initialDataLoaded]);

  // Carrega os dados assim que o Provider monta
  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  /**
   * 2. GERADOR DE CURSOS (IA)
   * Orquestra a chamada ao backend e atualiza o estado do usuário.
   */
  const generateCourse = async (topic, level = 'iniciante') => {
    if (isGenerating) return;

    setIsGenerating(true);
    setStatusMessage(`O Professor IA está estruturando seu curso sobre: ${topic}...`);

    try {
      const response = await api.post('/courses/generate', { topic, level });
      const { courseId, slug } = response.data;

      // Sincroniza tudo: créditos do usuário e contadores globais
      await Promise.all([
        fetchGlobalData(true),
        refreshUser()
      ]);

      setStatusMessage('Curso criado com sucesso! Redirecionando...');
      return { success: true, slug: slug || courseId };

    } catch (error) {
      const errorMsg = error.response?.data?.error || "Falha na geração do curso. Verifique seus créditos.";
      setStatusMessage(errorMsg);
      // No erro, resetamos o loading mais rápido para permitir nova tentativa
      setIsGenerating(false); 
      return { success: false, error: errorMsg };
    } finally {
      // Se sucesso, mantém a mensagem positiva por 2s
      setTimeout(() => {
        setIsGenerating(false);
        setStatusMessage('');
      }, 3000);
    }
  };

  /**
   * 3. CÁLCULO DE PROGRESSO (Sincronizado com Backend v2.0)
   */
  const getCourseProgress = useCallback(async (courseId) => {
    if (!courseId || !user?._id) return 0;
    
    try {
      const res = await api.get(`/courses/${courseId}/progress`);
      if (res.data.success) {
        // O backend agora retorna o campo 'progress' já calculado
        const { progress, status } = res.data;
        
        if (status === 'concluido') return 100;
        return progress || 0;
      }
    } catch (err) {
      console.error("Erro ao obter progresso:", err);
    }
    return 0;
  }, [user?._id]);

  return (
    <CourseContext.Provider value={{ 
      isGenerating, 
      statusMessage, 
      generateCourse,
      getCourseProgress,
      stats, 
      categories, 
      fetchGlobalData, 
      initialDataLoaded,
      hasPagination: stats.courses > COURSES_PER_PAGE
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse deve ser usado dentro de um CourseProvider');
  }
  return context;
};