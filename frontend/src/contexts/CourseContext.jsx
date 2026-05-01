import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { client } from '../client'; 
import api from '../services/api';     
import { useAuth } from './AuthContext';

const CourseContext = createContext();

export const COURSES_PER_PAGE = 6;

export const CourseProvider = ({ children }) => {
  const { refreshUser, signed } = useAuth(); 
  
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
   * 2. GERADOR DE CURSOS (IA)
   */
  const generateCourse = async (topic, level = 'iniciante') => {
    if (isGenerating) return;

    setIsGenerating(true);
    setStatusMessage(`O Professor IA está estruturando seu curso sobre: ${topic}...`);

    try {
      const response = await api.post('/courses/generate', { topic, level });
      const { courseId, slug } = response.data;

      // Sincroniza dados e créditos
      await Promise.all([
        fetchGlobalData(true),
        refreshUser() 
      ]);

      setStatusMessage('Curso criado com sucesso! Redirecionando...');
      return { success: true, slug: slug || courseId };

    } catch (error) {
      const errorMsg = error.response?.data?.error || "Falha na geração do curso.";
      setStatusMessage(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setStatusMessage('');
      }, 3000);
    }
  };

  /**
   * 3. BUSCAR PROGRESSO
   */
  const getCourseProgress = useCallback(async (courseId) => {
    if (!courseId || !signed) {
      return { progress: 0, completedLessons: [], completedQuizzes: [], status: 'visitante' };
    }
    
    try {
      const res = await api.get(`/courses/${courseId}/progress`);
      if (res.data.success) {
        return {
          progress: res.data.progress || 0,
          completedLessons: res.data.completedLessons || [],
          completedQuizzes: res.data.completedQuizzes || [],
          status: res.data.status
        };
      }
    } catch (err) {
      console.error("Erro ao obter progresso:", err);
    }
    return { progress: 0, completedLessons: [], completedQuizzes: [] };
  }, [signed]);

  /**
   * 4. ATUALIZAR PROGRESSO DE LIÇÃO
   */
  const updateLessonProgress = useCallback(async (courseId, lessonData) => {
    if (!signed) return { success: false, error: 'Necessário login' };
    
    try {
      const res = await api.post(`/courses/${courseId}/progress`, lessonData);
      
      if (res.data.success) {
          // Atualiza dados do usuário (pode haver ganho de XP)
          await refreshUser(); 
      }
      
      return res.data;
    } catch (err) {
      console.error("Erro ao salvar lição:", err);
      return { success: false, error: 'Erro interno ao salvar' };
    }
  }, [signed, refreshUser]);

  /**
   * 5. SALVAR QUIZ E ATUALIZAR XP (Centralizado)
   */
  const saveQuizResult = useCallback(async (courseId, quizData) => {
    if (!signed) return { success: false, error: 'Login necessário' };

    try {
      const res = await api.post(`/courses/${courseId}/quiz-result`, quizData);
      
      // Essencial: Atualiza o XP e Nível no AuthContext imediatamente
      await refreshUser();
      
      return res.data;
    } catch (err) {
      console.error("Erro ao salvar resultado do quiz:", err);
      return { success: false, error: 'Erro ao processar quiz' };
    }
  }, [signed, refreshUser]);

  return (
    <CourseContext.Provider value={{ 
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