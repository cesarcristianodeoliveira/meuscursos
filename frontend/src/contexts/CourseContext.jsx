import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { client } from '../client';

const CourseContext = createContext();

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

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const getCourseProgress = useCallback((course) => {
    if (!course || !course._id) return 0;
    try {
      const saved = localStorage.getItem(`progress-${course._id}`);
      const completedSteps = saved ? JSON.parse(saved) : [];
      const totalSteps = (course.modules?.length || 0) + (course.finalExam?.length > 0 ? 1 : 0);
      
      if (totalSteps === 0) return 0;
      const calc = Math.round((completedSteps.length / totalSteps) * 100);
      return Math.min(calc, 100);
    } catch (err) {
      return 0;
    }
  }, []);

  const checkQuotas = useCallback(async (retries = 3) => {
    try {
      const response = await fetch(`${API_BASE_URL}/provider-status?t=${Date.now()}`);
      if (!response.ok) throw new Error("Servidor acordando...");
      const data = await response.json();

      setProviders(prev => prev.map(p => {
        if (data[p.id]) {
          return { 
            ...p, 
            enabled: data[p.id].enabled,
            quotaLabel: data[p.id].message 
          };
        }
        return p;
      }));
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => checkQuotas(retries - 1), 5000);
      } else {
        setProviders(prev => prev.map(p => 
          p.id === 'groq' ? { ...p, quotaLabel: 'Servidor Offline' } : p
        ));
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

  const generateCourse = async (topic, onFinish) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(1); 
    setStatusMessage(`Iniciando motor de IA para: ${topic}...`);

    let currentSlug = null;

    try {
      const response = await fetch(`${API_BASE_URL}/generate-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, provider: selectedProvider }),
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
            
            // Atualização de UI
            if (data.progress !== undefined) setProgress(data.progress);
            if (data.message) setStatusMessage(data.message);
            
            // Captura o slug quando ele chegar no chunk final
            if (data.slug) {
                currentSlug = data.slug;
            }
            
          } catch (e) {
            console.warn("Falha ao processar chunk:", e);
          }
        }
      }

      // Finalização bem sucedida
      setProgress(100);
      setStatusMessage('Curso pronto! Preparando sua sala de aula...');
      
      // Atualiza os dados globais em background
      fetchGlobalData(true);
      checkQuotas(); 

      // Se tivermos o slug e o callback, dispara
      if (onFinish && currentSlug) {
        onFinish(currentSlug);
      }

    } catch (error) {
      console.error("Erro na geração:", error);
      setStatusMessage(error.message || 'Erro inesperado ao gerar.');
      // Em caso de erro, permitimos fechar o modal mais rápido
      setTimeout(() => setIsGenerating(false), 4000);
    } 
    // O reset do isGenerating agora é controlado pelo fluxo de sucesso ou erro,
    // evitando que o modal feche antes do redirecionamento do Hero.
  };

  return (
    <CourseContext.Provider value={{ 
      isGenerating, progress, statusMessage, generateCourse,
      getCourseProgress,
      stats, categories, fetchGlobalData, 
      initialDataLoaded, selectedProvider, setSelectedProvider,
      providers, checkQuotas,
      setIsGenerating // Exposto para caso precise forçar o fechamento
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);