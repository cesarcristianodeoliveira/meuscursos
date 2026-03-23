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

  // --- SINCRONIZAÇÃO DE COTAS (Com tratamento para o Cold Start do Render) ---
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
      console.warn(`Tentativa de cota falhou. Restantes: ${retries}`, err.message);
      
      if (retries > 0) {
        // Se falhar (Render dormindo), tenta de novo em 5 segundos
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
    const interval = setInterval(checkQuotas, 300000); // 5 min
    return () => clearInterval(interval);
  }, [checkQuotas]);

  // --- BUSCA DE DADOS GLOBAIS (Otimizada para o novo Schema) ---
  const fetchGlobalData = useCallback(async (force = false) => {
    if (initialDataLoaded && !force) return;
    try {
      // Query GROQ robusta: extrai nomes únicos de categorias
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
      
      // Ordena categorias e remove nulos
      const uniqueCats = (data.cats || []).filter(Boolean);
      const sortedCats = ['Recentes', ...uniqueCats.sort((a, b) => a.localeCompare(b))];

      setStats(data.stats);
      setCategories(sortedCats);
      setInitialDataLoaded(true);
    } catch (err) {
      console.error("Erro Sanity:", err);
    }
  }, [initialDataLoaded]);

  const getCourseProgress = useCallback((course) => {
    if (!course) return 0;
    const saved = localStorage.getItem(`progress-${course._id}`);
    const completedSteps = saved ? JSON.parse(saved) : [];
    const totalSteps = (course.modules?.length || 0) + (course.finalExam ? 1 : 0);
    return totalSteps === 0 ? 0 : Math.round((completedSteps.length / totalSteps) * 100);
  }, []);

  // --- GERAÇÃO DE CURSO (Streaming) ---
  const generateCourse = async (topic, callback) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(1); 
    setStatusMessage(`Acordando motor de IA...`);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, provider: selectedProvider }),
      });

      if (!response.body) throw new Error("Streaming não suportado.");

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
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmedLine.replace('data: ', ''));

            if (data.error) throw new Error(data.message || data.error);
            if (data.progress !== undefined) setProgress(data.progress);
            if (data.message) setStatusMessage(data.message);
            
          } catch (e) {
            console.warn("Falha no chunk JSON", e);
          }
        }
      }

      setProgress(100);
      setStatusMessage('Curso pronto!');
      
      // Forçar atualização de tudo
      setInitialDataLoaded(false); 
      await fetchGlobalData(true);
      await checkQuotas(); 

      if (callback) callback();

    } catch (error) {
      console.error("Erro na geração:", error);
      setStatusMessage(error.message || 'Erro ao gerar curso.');
      // Se der erro de cota, atualiza os labels de cota imediatamente
      checkQuotas();
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setStatusMessage('');
      }, 4000);
    }
  };

  return (
    <CourseContext.Provider value={{ 
      isGenerating, progress, statusMessage, generateCourse,
      getCourseProgress, stats, categories, fetchGlobalData, 
      initialDataLoaded, selectedProvider, setSelectedProvider,
      providers, checkQuotas 
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);