import React, { createContext, useState, useContext, useCallback } from 'react';
import { client } from '../client';

const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // --- GESTÃO DE PROVIDERS E "CRÉDITOS" (AutoAwesome) ---
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [providers] = useState([
    { 
      id: 'groq', 
      name: 'Groq Cloud', 
      model: 'Llama 3.3 70B', 
      enabled: true, 
      quotaLabel: 'Livre (Beta)',
      cost: 3 // Representação visual dos créditos
    },
    { 
      id: 'openai', 
      name: 'OpenAI', 
      model: 'GPT-4o', 
      enabled: false, 
      quotaLabel: 'Esgotado',
      cost: 5
    },
    { 
      id: 'google', 
      name: 'Google Gemini', 
      model: '1.5 Pro', 
      enabled: false, 
      quotaLabel: 'Em Breve',
      cost: 3
    },
  ]);

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
    setProgress(1); 
    setStatusMessage(`Solicitando ao ${selectedProvider.toUpperCase()}...`);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // AGORA ENVIAMOS O PROVIDER SELECIONADO PARA O BACKEND
        body: JSON.stringify({ 
          topic, 
          provider: selectedProvider 
        }),
      });

      if (!response.body) throw new Error("O navegador não suporta streaming.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let leftover = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (leftover + chunk).split('\n');
        leftover = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(':')) continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.replace('data: ', '');
              const data = JSON.parse(jsonStr);

              if (data.progress !== undefined) setProgress(data.progress);
              if (data.message) setStatusMessage(data.message);
              if (data.error) throw new Error(data.error);
            } catch (e) {
              console.warn("Processando dados de streaming...");
            }
          }
        }
      }

      setProgress(100);
      setStatusMessage('Curso finalizado com sucesso!');
      
      setInitialDataLoaded(false); 
      await fetchGlobalData(true);
      
      if (callback) callback();

    } catch (error) {
      console.error("Erro na geração:", error);
      setStatusMessage(error.message || 'Erro ao gerar curso.');
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
      isGenerating, 
      progress, 
      statusMessage, 
      generateCourse,
      getCourseProgress, 
      stats, 
      categories, 
      fetchGlobalData, 
      initialDataLoaded,
      // EXPORTANDO OS NOVOS ESTADOS PARA O HERO
      selectedProvider,
      setSelectedProvider,
      providers
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);