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

  // --- SINCRONIZAÇÃO DE COTAS (Tratamento para Render Cold Start) ---
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

  // --- BUSCA DE DADOS GLOBAIS ---
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

  // --- GERAÇÃO DE CURSO (Streaming com Captura de Slug) ---
  const generateCourse = async (topic, onFinish) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(1); 
    setStatusMessage(`Iniciando motor de IA para: ${topic}...`);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, provider: selectedProvider }),
      });

      if (!response.body) throw new Error("Seu navegador não suporta streaming.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let leftover = '';
      let generatedSlug = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (leftover + chunk).split('\n');
        leftover = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmedLine.replace('data: ', ''));

            if (data.error) throw new Error(data.message || data.error);
            if (data.progress !== undefined) setProgress(data.progress);
            if (data.message) setStatusMessage(data.message);
            
            // PESCA O SLUG QUANDO ELE CHEGA DO BACKEND
            if (data.slug) {
              generatedSlug = data.slug;
            }
            
          } catch (e) {
            console.warn("Parsing chunk error", e);
          }
        }
      }

      // Finalização com sucesso
      setProgress(100);
      setStatusMessage('Curso finalizado com sucesso!');
      
      // Forçamos a atualização das categorias e estatísticas no Dashboard
      await fetchGlobalData(true);
      await checkQuotas(); 

      // Se o backend enviou o slug, avisamos o Hero para redirecionar
      if (onFinish && generatedSlug) {
        onFinish(generatedSlug);
      }

    } catch (error) {
      console.error("Erro na geração:", error);
      setStatusMessage(error.message || 'Erro inesperado ao gerar.');
      checkQuotas();
    } finally {
      // Pequeno delay para o usuário ver o "100%" e a mensagem de sucesso
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
      stats, categories, fetchGlobalData, 
      initialDataLoaded, selectedProvider, setSelectedProvider,
      providers, checkQuotas 
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);