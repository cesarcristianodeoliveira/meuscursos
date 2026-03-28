import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { client } from '../client';

const CourseContext = createContext();

export const COURSES_PER_PAGE = 6;

export const CourseProvider = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('groq');

  const [providers, setProviders] = useState([
    { id: 'groq', name: 'Groq', model: 'Llama 3.3 70B', enabled: true, quotaLabel: 'Verificando...' },
    { id: 'openai', name: 'ChatGPT', model: 'GPT-4o', enabled: false, quotaLabel: 'Em Breve' },
    { id: 'google', name: 'Gemini', model: '1.5 Pro', enabled: false, quotaLabel: 'Em Breve' },
  ]);

  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [categories, setCategories] = useState(['Recentes']);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const hasPagination = stats.courses > COURSES_PER_PAGE;
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const getCourseProgress = useCallback((course) => {
    if (!course || !course._id) return 0;
    try {
      const saved = localStorage.getItem(`progress-${course._id}`);
      const completedSteps = saved ? JSON.parse(saved) : [];
      const totalSteps = (course.modules?.length || 0) + (course.finalExam?.length > 0 ? 1 : 0);
      
      if (totalSteps === 0) return 0;
      return Math.min(Math.round((completedSteps.length / totalSteps) * 100), 100);
    } catch (err) {
      return 0;
    }
  }, []);

  const checkQuotas = useCallback(async (retries = 3) => {
    try {
      const response = await fetch(`${API_BASE_URL}/provider-status?t=${Date.now()}`);
      if (!response.ok) throw new Error("Servidor acordando...");
      const data = await response.json();

      setProviders(prev => prev.map(p => data[p.id] ? { 
        ...p, 
        enabled: data[p.id].enabled,
        quotaLabel: data[p.id].message 
      } : p));
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => checkQuotas(retries - 1), 5000);
      } else {
        setProviders(prev => prev.map(p => p.id === 'groq' ? { ...p, quotaLabel: 'Offline' } : p));
      }
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    checkQuotas();
    const interval = setInterval(checkQuotas, 300000); 
    return () => clearInterval(interval);
  }, [checkQuotas]);

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
        "cats": array::unique(*[_type == "course" && defined(category.name)].category.name)
      }`;
      const data = await client.fetch(query);
      const uniqueCats = (data.cats || []).filter(Boolean);
      const sortedCats = ['Recentes', ...uniqueCats.sort((a, b) => a.localeCompare(b))];

      setStats(data.stats);
      setCategories(sortedCats);
      setInitialDataLoaded(true);
    } catch (err) {
      console.error("Erro Sanity:", err);
    }
  }, [initialDataLoaded]);

  // CORREÇÃO: Agora aceita o userId vindo do Hero/Dashboard
  const generateCourse = async (topic, userId, onFinish) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(1); 
    setStatusMessage(`Solicitando criação de: ${topic}...`);

    let currentSlug = null;

    try {
      const response = await fetch(`${API_BASE_URL}/generate-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANTE: Enviando userId para o backend
        body: JSON.stringify({ topic, provider: selectedProvider, userId }),
      });

      if (!response.body) throw new Error("Seu navegador não suporta streaming.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmedLine.replace('data: ', ''));

            if (data.error) throw new Error(data.message || data.error);
            if (data.progress !== undefined) setProgress(data.progress);
            if (data.message) setStatusMessage(data.message);
            if (data.slug) currentSlug = data.slug;
            
          } catch (e) {
            console.warn("Falha ao processar chunk:", e);
          }
        }
      }

      setProgress(100);
      setStatusMessage('Sucesso! Redirecionando...');
      
      await fetchGlobalData(true);
      checkQuotas(); 

      if (onFinish && currentSlug) {
        onFinish(currentSlug);
      }

      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setStatusMessage('');
      }, 3000);

    } catch (error) {
      console.error("Erro na geração:", error);
      setStatusMessage(error.message || 'Erro inesperado.');
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 4000);
    } 
  };

  return (
    <CourseContext.Provider value={{ 
      isGenerating, progress, statusMessage, generateCourse,
      getCourseProgress,
      stats, categories, fetchGlobalData, 
      initialDataLoaded, selectedProvider, setSelectedProvider,
      providers, checkQuotas,
      setIsGenerating,
      hasPagination
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);