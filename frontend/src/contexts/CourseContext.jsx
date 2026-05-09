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
   * Sincronizado com os novos serviços de Imagem e Duração Real.
   */
  const generateCourse = useCallback(async (topic, level = 'iniciante') => {
    if (isGenerating) return { success: false, error: 'Uma geração já está em andamento.' };

    setIsGenerating(true);
    setStatusMessage(`O Professor IA está analisando o tema: ${topic}...`);

    try {
      // Mensagens que refletem o que realmente está acontecendo no backend corrigido
      const statusSteps = [
        "IA estruturando módulos e lições...",
        "Redigindo conteúdo técnico detalhado...",
        "Calculando tempo estimado de leitura...",
        "Gerando questões para os quizzes...",
        "Buscando arte de capa no Pixabay...",
        "Finalizando sua sala de aula..."
      ];

      let step = 0;
      const interval = setInterval(() => {
        if (step < statusSteps.length) {
          setStatusMessage(statusSteps[step]);
          step++;
        }
      }, 4000); // Aumentado para 4s para dar tempo da IA processar conteúdo denso
      
      const response = await api.post('/courses/generate', { topic, level });
      clearInterval(interval);
      
      const { slug, updatedCredits, updatedXp } = response.data;

      // Sincronização imediata: Garante que o Header/Perfil reflita o gasto de créditos
      if (updatedCredits !== undefined) {
        setUser(prev => ({ 
          ...prev, 
          credits: updatedCredits, 
          xp: updatedXp || prev.xp 
        }));
      }

      await fetchGlobalData(true);
      setStatusMessage('Curso pronto! Redirecionando...');
      
      return { success: true, slug: slug };

    } catch (error) {
      console.error("❌ Erro na geração:", error);
      const errorMsg = error.response?.data?.error || "A IA está processando muitos dados. Tente novamente em instantes.";
      setStatusMessage(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      // Delay suave para o usuário ver a mensagem final de sucesso/erro
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
      
      // Atualização de XP em tempo real no contexto do usuário
      if (res.data.success && res.data.updatedXp) {
        setUser(prev => ({ ...prev, xp: res.data.updatedXp }));
      }
      
      return res.data;
    } catch (err) {
      return { success: false, error: 'Falha ao salvar resultado.' };
    }
  }, [signed, setUser]);

  /**
   * 5. MEMOIZAÇÃO DOS VALORES
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