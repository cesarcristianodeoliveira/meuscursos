import React, { createContext, useState, useContext, useCallback } from 'react';
import { client } from '../client';

const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [categories, setCategories] = useState(['Recentes']);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchGlobalData = useCallback(async (force = false) => {
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
    setProgress(1); // Inicia com 1% para dar feedback imediato
    setStatusMessage('Iniciando conexão com o motor de IA...');

    try {
      const response = await fetch(`${API_BASE_URL}/generate-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.body) throw new Error("O navegador não suporta streaming.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Variável para acumular pedaços de JSON caso venham cortados
      let leftover = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (leftover + chunk).split('\n');
        
        // A última linha pode estar incompleta, guardamos para o próximo chunk
        leftover = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Ignora linhas de padding (espaços) ou comentários SSE que começam com ":"
          if (!trimmedLine || trimmedLine.startsWith(':')) continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.replace('data: ', '');
              const data = JSON.parse(jsonStr);

              if (data.progress !== undefined) setProgress(data.progress);
              if (data.message) setStatusMessage(data.message);
              if (data.error) throw new Error(data.error);
            } catch (e) {
              console.warn("Aguardando fragmento de dados completo...");
            }
          }
        }
      }

      // Finalização bem-sucedida
      setProgress(100);
      setStatusMessage('Curso pronto! Redirecionando...');
      await fetchGlobalData(true);
      
      if (callback) callback();

    } catch (error) {
      console.error("Erro na geração:", error);
      setStatusMessage(error.message || 'Erro ao gerar curso. Tente novamente.');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setStatusMessage('');
      }, 3500);
    }
  };

  return (
    <CourseContext.Provider value={{ 
      isGenerating, progress, statusMessage, generateCourse,
      getCourseProgress, stats, categories, fetchGlobalData, initialDataLoaded 
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);