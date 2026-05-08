import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { client } from '../client'; 
import api from '../services/api';     
import { useAuth } from './AuthContext';

const CourseContext = createContext();

export const COURSES_PER_PAGE = 6;

export const CourseProvider = ({ children }) => {
  const { setUser, signed } = useAuth(); // Usando setUser para atualização atômica
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [categories, setCategories] = useState(['Recentes']);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  /**
   * 1. BUSCA DADOS GLOBAIS (Stats da Home)
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
   * Otimizado para atualizar créditos sem requisições extras.
   */
  const generateCourse = useCallback(async (topic, level = 'iniciante') => {
    if (isGenerating) return { success: false, error: 'Já existe uma geração em curso.' };

    setIsGenerating(true);
    setStatusMessage(`O Professor IA está estruturando o conteúdo sobre: ${topic}...`);

    try {
      // Feedback visual das etapas
      const statusSteps = [
        "IA gerando conteúdo e lições técnicas...",
        "Validando estrutura didática...",
        "Finalizando design e buscando mídias visuais..."
      ];

      let step = 0;
      const interval = setInterval(() => {
        if (step < statusSteps.length) {
          setStatusMessage(statusSteps[step]);
          step++;
        } else {
          clearInterval(interval);
        }
      }, 3000);
      
      const response = await api.post('/courses/generate', { topic, level });
      clearInterval(interval);
      
      const { slug, updatedCredits, updatedXp } = response.data;

      // 🔄 Sincronização Atômica: Atualiza o usuário globalmente com os novos dados
      if (updatedCredits !== undefined) {
        setUser(prev => ({ ...prev, credits: updatedCredits, xp: updatedXp }));
      }

      // Atualiza as estatísticas da home (total de cursos aumentou)
      await fetchGlobalData(true);

      setStatusMessage('Curso criado com sucesso! Redirecionando...');
      return { success: true, slug: slug };

    } catch (error) {
      const errorMsg = error.response?.data?.error || "Falha na geração do curso.";
      setStatusMessage(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setStatusMessage('');
      }, 2500);
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
      console.error("Erro ao obter progresso:", err);
      return { progress: 0, completedLessons: [], completedQuizzes: [] };
    }
  }, [signed]);

  /**
   * 4. ATUALIZAR PROGRESSO DE LIÇÃO
   */
  const updateLessonProgress = useCallback(async (courseId, lessonData) => {
    if (!signed) return { success: false, error: 'Faça login para salvar progresso.' };
    
    try {
      const res = await api.post(`/courses/${courseId}/progress`, lessonData);
      return res.data;
    } catch (err) {
      console.error("Erro ao salvar lição:", err);
      return { success: false, error: 'Erro ao salvar progresso.' };
    }
  }, [signed]);

  /**
   * 5. SALVAR QUIZ E ATUALIZAR GAMIFICATION
   */
  const saveQuizResult = useCallback(async (courseId, quizData) => {
    if (!signed) return { success: false, error: 'Login necessário' };

    try {
      const res = await api.post(`/courses/${courseId}/quiz-result`, quizData);
      
      // Se a resposta trouxer dados de XP atualizados, aplicamos ao usuário
      if (res.data.success && res.data.updatedXp) {
        setUser(prev => ({ ...prev, xp: res.data.updatedXp }));
      }
      
      return res.data;
    } catch (err) {
      console.error("Erro ao salvar resultado do quiz:", err);
      return { success: false, error: 'Erro ao processar resultado do quiz.' };
    }
  }, [signed, setUser]);

  /**
   * Valor do contexto memoizado.
   */
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
    isGenerating, 
    statusMessage, 
    generateCourse, 
    getCourseProgress, 
    updateLessonProgress, 
    saveQuizResult, 
    stats, 
    categories, 
    fetchGlobalData, 
    initialDataLoaded
  ]);

  return (
    <CourseContext.Provider value={contextValue}>
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