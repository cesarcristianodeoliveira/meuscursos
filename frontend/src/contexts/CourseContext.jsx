import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import client from '../config/sanity'; // Usando sua config centralizada do Sanity
import api from '../services/api';     // Usando sua instância do Axios

const CourseContext = createContext();

export const COURSES_PER_PAGE = 6;

export const CourseProvider = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [categories, setCategories] = useState(['Recentes']);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  /**
   * 1. Cálculo de progresso do aluno (Baseado em LocalStorage para ser público)
   */
  const getCourseProgress = useCallback((course) => {
    if (!course || !course._id) return 0;
    try {
      const saved = localStorage.getItem(`progress-${course._id}`);
      const completedSteps = saved ? JSON.parse(saved) : [];
      // Passos = módulos + exame final
      const totalSteps = (course.modules?.length || 0) + (course.finalExam?.length > 0 ? 1 : 0);
      
      if (totalSteps === 0) return 0;
      return Math.min(Math.round((completedSteps.length / totalSteps) * 100), 100);
    } catch (err) {
      return 0;
    }
  }, []);

  /**
   * 2. Busca categorias e números globais do Sanity
   */
  const fetchGlobalData = useCallback(async (force = false) => {
    if (initialDataLoaded && !force) return;
    try {
      // Query otimizada para buscar categorias e contagens
      const query = `{
        "stats": {
          "courses": count(*[_type == "course"]),
          "categories": count(*[_type == "category"]),
          "lessons": count(*[_type == "course"].modules[]),
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
   * 3. Gerador de Cursos (Chamada ao nosso novo Backend)
   */
  const generateCourse = async (topic, level = 'iniciante') => {
    if (isGenerating) return;

    setIsGenerating(true);
    setStatusMessage(`O Professor IA está estruturando seu curso sobre: ${topic}...`);

    try {
      // Chamada para o endpoint que criamos no cursoController
      const response = await api.post('/courses/generate', { 
        topic, 
        level 
      });

      const { course, message } = response.data;

      setStatusMessage(message || 'Curso criado com sucesso!');
      
      // Atualiza os números do dashboard
      await fetchGlobalData(true);

      return { success: true, slug: course.slug };

    } catch (error) {
      const errorMsg = error.response?.data?.error || "Falha na geração do curso.";
      setStatusMessage(errorMsg);
      console.error("❌ Erro ao gerar curso:", errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      // Pequeno delay para o usuário ler a mensagem de sucesso/erro
      setTimeout(() => {
        setIsGenerating(false);
        setStatusMessage('');
      }, 3000);
    }
  };

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