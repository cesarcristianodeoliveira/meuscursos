import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { client } from '../client'; 
import api from '../services/api';     
import { useAuth } from './AuthContext';

const CourseContext = createContext();

export const COURSES_PER_PAGE = 6;

export const CourseProvider = ({ children }) => {
  // Removido 'refreshUser' daqui para eliminar o warning de variável não utilizada
  const { setUser, signed } = useAuth(); 
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [categories, setCategories] = useState(['Recentes']);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  /**
   * 1. BUSCA DADOS GLOBAIS
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
      
      const sortedCats = [
        'Recentes', 
        ...(data.cats || [])
          .filter(c => c && c.trim() !== '')
          .sort((a, b) => a.localeCompare(b))
      ];

      setStats(data.stats || { courses: 0, lessons: 0, quizzes: 0, categories: 0 });
      setCategories(sortedCats);
      setInitialDataLoaded(true);
    } catch (err) {
      console.error("❌ Erro ao buscar estatísticas globais:", err);
    }
  }, [initialDataLoaded]);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  /**
   * 2. GERADOR DE CURSOS (Sincronizado com LXD v3.0)
   */
  const generateCourse = useCallback(async (topic, level = 'iniciante') => {
    if (isGenerating) return { success: false, error: 'Uma geração já está em andamento.' };

    setIsGenerating(true);
    setStatusMessage(`Analisando o tema: ${topic}...`);

    try {
      const statusSteps = [
        "IA estruturando módulos e lições...",
        "Redigindo conteúdo técnico profundo...",
        "Calculando tempo estimado de leitura...",
        "Gerando questões para os quizzes...",
        "Buscando arte de capa contextual...",
        "Finalizando sua sala de aula..."
      ];

      let step = 0;
      const interval = setInterval(() => {
        if (step < statusSteps.length) {
          setStatusMessage(statusSteps[step]);
          step++;
        }
      }, 4000); 
      
      const response = await api.post('/courses/generate', { topic, level });
      clearInterval(interval);
      
      const { slug, updatedCredits, updatedXp } = response.data;

      // ATUALIZAÇÃO OTIMISTA: Atualiza o estado global sem esperar nova chamada de API
      if (updatedCredits !== undefined) {
        setUser(prev => ({ 
          ...prev, 
          credits: updatedCredits, 
          xp: updatedXp ?? prev.xp,
          stats: {
            ...prev.stats,
            totalXp: updatedXp ?? (prev.stats?.totalXp || 0),
            coursesCreated: (prev.stats?.coursesCreated || 0) + 1
          }
        }));
      }

      await fetchGlobalData(true);
      setStatusMessage('Curso pronto! Redirecionando...');
      
      return { success: true, slug };

    } catch (error) {
      console.error("❌ Erro na geração:", error);
      const errorMsg = error.response?.data?.error || "A IA está processando muitos dados. Tente novamente.";
      setStatusMessage(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setStatusMessage('');
      }, 1500);
    }
  }, [isGenerating, fetchGlobalData, setUser]);

  /**
   * 3. BUSCAR PROGRESSO DO ALUNO
   */
  const getCourseProgress = useCallback(async (courseId) => {
    if (!courseId || !signed) return { progress: 0 };
    try {
      const res = await api.get(`/courses/${courseId}/progress`);
      return res.data; 
    } catch (err) {
      return { progress: 0, error: true };
    }
  }, [signed]);

  /**
   * 4. SALVAR QUIZ E ATUALIZAR GAMIFICATION
   */
  const saveQuizResult = useCallback(async (courseId, quizData) => {
    if (!signed) return { success: false, error: 'Login necessário.' };

    try {
      const res = await api.post(`/courses/${courseId}/quiz-result`, quizData);
      
      if (res.data.success && res.data.updatedXp !== undefined) {
        setUser(prev => ({ 
          ...prev, 
          xp: res.data.updatedXp,
          stats: {
            ...prev.stats,
            totalXp: res.data.updatedXp
          }
        }));
      }
      
      return res.data;
    } catch (err) {
      return { success: false, error: 'Falha ao salvar resultado.' };
    }
  }, [signed, setUser]);

  /**
   * 5. MEMOIZAÇÃO COMPLETA
   */
  const contextValue = useMemo(() => ({
    isGenerating, 
    statusMessage, 
    generateCourse,
    getCourseProgress,
    updateLessonProgress: async (id, data) => (await api.post(`/courses/${id}/progress`, data)).data,
    saveQuizResult, 
    stats, 
    categories, 
    fetchGlobalData, 
    initialDataLoaded,
    hasPagination: stats.courses > COURSES_PER_PAGE
  }), [
    isGenerating, statusMessage, generateCourse, getCourseProgress, 
    saveQuizResult, stats, categories, fetchGlobalData, initialDataLoaded
  ]);

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) throw new Error('useCourse deve ser usado dentro de um CourseProvider');
  return context;
};