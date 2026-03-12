import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { client } from '../client';

const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // --- ESTADOS DE CACHE GLOBAL ---
  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [categories, setCategories] = useState(['Recentes']);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Função centralizada para buscar Stats e Categorias
  const fetchGlobalData = useCallback(async (force = false) => {
    // Se já carregou e não for um refresh forçado (pós-geração), não faz nada
    if (initialDataLoaded && !force) return;

    try {
      const query = `{
        "stats": {
          "courses": count(*[_type == "course"]),
          "categories": count(array::unique(*[_type == "course"].category.name)),
          "lessons": count(*[_type == "course"].modules[]),
          "quizzes": count(*[_type == "course"].modules[].exercises[])
        },
        "cats": *[_type == "course" && defined(category)].category.name
      }`;
      
      const data = await client.fetch(query);
      const uniqueCats = [...new Set(data.cats)];
      const sortedCats = ['Recentes', ...uniqueCats.sort((a, b) => a.localeCompare(b))];

      setStats(data.stats);
      setCategories(sortedCats);
      setInitialDataLoaded(true);
    } catch (err) {
      console.error("Erro ao carregar dados globais:", err);
    }
  }, [initialDataLoaded]);

  const getCourseProgress = useCallback((course) => {
    if (!course) return 0;
    const saved = localStorage.getItem(`progress-${course._id}`);
    const completedSteps = saved ? JSON.parse(saved) : [];
    const totalSteps = (course.modules?.length || 0) + (course.finalExam ? 1 : 0);
    return totalSteps === 0 ? 0 : Math.round((completedSteps.length / totalSteps) * 100);
  }, []);

  const generateCourse = async (topic, callback) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setStatusMessage('Iniciando conexão com a IA...');

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) { setStatusMessage('Pesquisando referências...'); return prev + 1; }
        if (prev < 60) { setStatusMessage('Estruturando módulos...'); return prev + 0.5; }
        if (prev < 90) { setStatusMessage('Finalizando e gerando imagens...'); return prev + 0.2; }
        return prev;
      });
    }, 500);

    try {
      await axios.post(`${API_BASE_URL}/generate-course`, { topic });
      setProgress(100);
      setStatusMessage('Curso pronto!');
      
      // Força a atualização do cache global para refletir o novo curso nas estatísticas
      await fetchGlobalData(true);
      
      if (callback) callback(); 
    } catch (error) {
      console.error("Erro ao gerar curso:", error);
      alert('Houve um erro técnico ao gerar o curso.');
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setStatusMessage('');
      }, 2000);
    }
  };

  return (
    <CourseContext.Provider value={{ 
      isGenerating, 
      progress, 
      statusMessage, 
      generateCourse,
      getCourseProgress,
      stats,
      categories,
      fetchGlobalData,
      initialDataLoaded
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);