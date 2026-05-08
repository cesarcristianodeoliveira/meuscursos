import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { client } from '../client'; 
import api from '../services/api';     
import { useAuth } from './AuthContext';

const CourseContext = createContext();

export const COURSES_PER_PAGE = 6;

export const CourseProvider = ({ children }) => {
  const { setUser, signed } = useAuth(); 
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [categories, setCategories] = useState(['Recentes']);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  /**
   * 1. BUSCA DADOS GLOBAIS (Estatísticas e Categorias)
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
   * 2. GERADOR DE CURSOS (IA)
   * Agora com feedback visual mais rico e atualização de créditos.
   */
  const generateCourse = useCallback(async (topic, level = 'iniciante') => {
    if (isGenerating) return { success: false, error: 'Uma geração já está em andamento.' };

    setIsGenerating(true);
    setStatusMessage(`O Professor IA está analisando o tema: ${topic}...`);

    try {
      const statusSteps = [
        "IA estruturando módulos e lições...",
        "Pesquisando referências técnicas...",
        "Criando desafios e quizzes...",
        "Gerando arte de capa personalizada..."
      ];

      let step = 0;
      const interval = setInterval(() => {
        if (step < statusSteps.length) {
          setStatusMessage(statusSteps[step]);
          step++;
        }
      }, 3500);
      
      const response = await api.post('/courses/generate', { topic, level });
      clearInterval(interval);
      
      const { slug, updatedCredits, updatedXp } = response.data;

      // Sincronização imediata do perfil do usuário
      if (updatedCredits !== undefined) {
        setUser(prev => ({ ...prev, credits: updatedCredits, xp: updatedXp }));
      }

      await fetchGlobalData(true);
      setStatusMessage('Curso pronto! Preparando sua sala de aula...');
      
      return { success: true, slug: slug };

    } catch (error) {
      const errorMsg = error.response?.data?.error || "A IA está ocupada. Tente novamente em instantes.";
      setStatusMessage(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setStatusMessage('');
      }, 2000);
    }
  }, [isGenerating, fetchGlobalData, setUser]);

  /**
   * 3. BUSCAR PROGRESSO DO ALUNO
   */
  const getCourseProgress = useCallback(async (courseId) => {
    if (!courseId || !signed) {
      return { progress: 0, completedLessons: [], completedQuizzes: [], status: 'visitante' };
    }
    
    try {
      const res = await api.get(`/courses/${courseId}/progress`);
      return {
        progress: res.data.progress || 0,
        completedLessons: res.data.completedLessons || [],
        completedQuizzes: res.data.completedQuizzes || [],
        status: res.data.status || 'em_andamento'
      };
    } catch (err) {
      return { progress: 0, completedLessons: [], completedQuizzes: [], status: 'erro' };
    }
  }, [signed]);

  /**
   * 4. ATUALIZAR PROGRESSO DE LIÇÃO
   */
  const updateLessonProgress = useCallback(async (courseId, lessonData) => {
    if (!signed) return { success: false, error: 'Login necessário.' };
    
    try {
      const res = await api.post(`/courses/${courseId}/progress`, lessonData);
      return res.data;
    } catch (err) {
      return { success: false, error: 'Erro de conexão ao salvar progresso.' };
    }
  }, [signed]);

  /**
   * 5. SALVAR QUIZ E ATUALIZAR GAMIFICATION
   */
  const saveQuizResult = useCallback(async (courseId, quizData) => {
    if (!signed) return { success: false, error: 'Login necessário.' };

    try {
      const res = await api.post(`/courses/${courseId}/quiz-result`, quizData);
      
      // Se ganhou XP ao finalizar ou passar no quiz, atualiza o cabeçalho/avatar
      if (res.data.success && res.data.updatedXp) {
        setUser(prev => ({ ...prev, xp: res.data.updatedXp }));
      }
      
      return res.data;
    } catch (err) {
      return { success: false, error: 'Falha ao processar resultado do quiz.' };
    }
  }, [signed, setUser]);

  const contextValue = useMemo(() => ({
    isGenerating, 
    statusMessage, 
    generateCourse,
    getCourseProgress,
    updateLessonProgress,
    saveQuizResult, 
    stats, 
    categories, 
    fetchGlobalData, 
    initialDataLoaded,
    hasPagination: stats.courses > COURSES_PER_PAGE
  }), [
    isGenerating, statusMessage, generateCourse, getCourseProgress, 
    updateLessonProgress, saveQuizResult, stats, categories, 
    fetchGlobalData, initialDataLoaded
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