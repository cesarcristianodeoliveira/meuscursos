import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { client } from '../client'; 
import api from '../services/api';     
import { useAuth } from '../contexts/AuthContext';

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
   * 1. Busca categorias e números globais (Schema v1.3)
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
      const sortedCats = ['Recentes', ...(data.cats || []).sort()];

      setStats(data.stats);
      setCategories(sortedCats);
      setInitialDataLoaded(true);
    } catch (err) {
      console.error("❌ Erro ao buscar dados globais:", err);
    }
  }, [initialDataLoaded]);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  /**
   * 2. Gerador de Cursos (Integração v1.3)
   */
  const generateCourse = async (topic, level = 'iniciante') => {
    if (isGenerating) return;

    setIsGenerating(true);
    setStatusMessage(`O Professor IA está estruturando suas aulas sobre: ${topic}...`);

    try {
      const response = await api.post('/courses/generate', { 
        topic, 
        level 
      });

      const { course } = response.data;

      // Atualiza dados globais e créditos do usuário imediatamente
      await Promise.all([
        fetchGlobalData(true),
        refreshUser()
      ]);

      setStatusMessage('Curso criado com sucesso! Redirecionando...');
      return { success: true, slug: course.slug };

    } catch (error) {
      const errorMsg = error.response?.data?.error || "Falha na geração do curso.";
      setStatusMessage(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      // Tempo para o usuário ler a mensagem de sucesso/erro
      setTimeout(() => {
        setIsGenerating(false);
        setStatusMessage('');
      }, 3000);
    }
  };

  /**
   * 3. Cálculo de Progresso (Híbrido: API + LocalStorage)
   * Agora busca do banco se o usuário estiver logado.
   */
  const getCourseProgress = useCallback(async (courseId, modules) => {
    if (!courseId) return 0;
    
    let completedIds = [];

    // Tenta buscar progresso real da API se houver usuário
    if (user?._id) {
      try {
        const res = await api.get(`/courses/${courseId}/progress`);
        if (res.data.success) {
          completedIds = res.data.completedLessons || [];
        }
      } catch (err) {
        // Fallback para LocalStorage se a API falhar
        const saved = localStorage.getItem(`progress-${courseId}`);
        completedIds = saved ? JSON.parse(saved) : [];
      }
    }

    // Calcula total de lições nos módulos v1.3
    const totalLessons = modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;
    
    if (totalLessons === 0) return 0;

    const percentage = (completedIds.length / totalLessons) * 100;
    return Math.min(Math.round(percentage), 100);
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
  if (!context) throw new Error('useCourse deve ser usado dentro de um CourseProvider');
  return context;
};