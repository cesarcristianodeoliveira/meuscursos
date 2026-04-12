import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { client } from '../client'; 
import api from '../services/api';     
import { useAuth } from '../contexts/AuthContext'; // Importante para atualizar créditos

const CourseContext = createContext();

export const COURSES_PER_PAGE = 6;

export const CourseProvider = ({ children }) => {
  const { setUser } = useAuth(); // Acessamos o AuthContext
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [categories, setCategories] = useState(['Recentes']);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  /**
   * 1. Busca categorias e números globais (Ajustado para Schema v1.3)
   */
  const fetchGlobalData = useCallback(async (force = false) => {
    if (initialDataLoaded && !force) return;
    try {
      const query = `{
        "stats": {
          "courses": count(*[_type == "course"]),
          "categories": count(*[_type == "category"]),
          "lessons": count(*[_type == "course"].modules[].lessons[]), // Caminho atualizado
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
   * 2. Gerador de Cursos (Chamada ao Backend + Refresh de Créditos)
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

      const { course, message } = response.data;

      // 1. Atualizar as estatísticas do Dashboard
      await fetchGlobalData(true);

      // 2. IMPORTANTE: Atualizar o perfil do usuário logado (créditos e contador)
      // Fazemos uma chamada ao /me para pegar o novo saldo de créditos e stats
      const userRes = await api.get('/auth/me');
      if (userRes.data.success) {
        setUser(userRes.data.user);
      }

      setStatusMessage(message || 'Curso criado com sucesso!');
      return { success: true, slug: course.slug };

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
   * 3. Progresso do Aluno (Ajustado para Lessons)
   */
  const getCourseProgress = useCallback((course) => {
    if (!course || !course._id) return 0;
    try {
      const saved = localStorage.getItem(`progress-${course._id}`);
      const completedSteps = saved ? JSON.parse(saved) : [];
      
      // Passos agora são o total de AULAS + Exame Final
      const totalLessons = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;
      const totalSteps = totalLessons + (course.finalExam?.length > 0 ? 1 : 0);

      if (totalSteps === 0) return 0;
      return Math.min(Math.round((completedSteps.length / totalSteps) * 100), 100);
    } catch (err) {
      return 0;
    }
  }, []);

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

export const useCourse = () => useContext(CourseContext);