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
   * 1. Busca estatísticas e categorias (Otimizado com Cache Local)
   */
  const fetchGlobalData = useCallback(async (force = false) => {
    // Evita refetch se já carregou, a menos que seja forçado (ex: após criar curso)
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
      
      const sortedCats = ['Recentes', ...(data.cats || []).filter(c => c).sort()];

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
   * 2. Gerador de Cursos
   */
  const generateCourse = async (topic, level = 'iniciante') => {
    if (isGenerating) return;

    setIsGenerating(true);
    setStatusMessage(`O Professor IA está estruturando seu curso sobre: ${topic}...`);

    try {
      // Endpoint que chama a v1.6 do Controller
      const response = await api.post('/courses/generate', { topic, level });
      const { course } = response.data;

      // Sincroniza dados globais e créditos do usuário simultaneamente
      await Promise.all([
        fetchGlobalData(true),
        refreshUser()
      ]);

      setStatusMessage('Curso criado com sucesso! Redirecionando...');
      return { success: true, slug: course.slug.current || course.slug };

    } catch (error) {
      const errorMsg = error.response?.data?.error || "Falha na geração do curso.";
      setStatusMessage(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      // Mantém a mensagem por 2s antes de resetar o estado de carregamento
      setTimeout(() => {
        setIsGenerating(false);
        setStatusMessage('');
      }, 2000);
    }
  };

  /**
   * 3. Cálculo de Progresso (v2.0 - Suporte a Exame Final)
   * Agora considera se o curso está com status 'concluido' no banco
   */
  const getCourseProgress = useCallback(async (courseId, modules) => {
    if (!courseId || !modules) return 0;
    
    try {
      if (user?._id) {
        const res = await api.get(`/courses/${courseId}/progress`);
        if (res.data.success) {
          const { completedLessons, status } = res.data;
          
          // Se o status no banco já é concluído, o progresso é 100% (independente de desmarcar aula)
          if (status === 'concluido') return 100;

          const totalLessons = modules.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0);
          if (totalLessons === 0) return 0;

          // Calculamos o progresso baseado nas aulas, mas limitamos a 99% 
          // O 100% real só vem quando o status for 'concluido' (após o Exame Final)
          const percentage = (completedLessons.length / totalLessons) * 100;
          return Math.min(Math.round(percentage), 99);
        }
      }
    } catch (err) {
      console.error("Erro ao calcular progresso:", err);
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
  if (!context) throw new Error('useCourse deve ser usado dentro de um CourseProvider');
  return context;
};