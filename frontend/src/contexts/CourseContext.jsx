import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { client } from '../client';

const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('groq');

  // Estado inicial dos provedores
  const [providers, setProviders] = useState([
    { 
      id: 'groq', 
      name: 'Groq', 
      model: 'Llama 3.3 70B', 
      enabled: true, 
      quotaLabel: 'Carregando',
      cost: 3 
    },
    { 
      id: 'openai', 
      name: 'ChatGPT', 
      model: 'GPT-4o', 
      enabled: false, 
      quotaLabel: 'Em Breve',
      cost: 5
    },
    { 
      id: 'google', 
      name: 'Gemini', 
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

  // --- SINCRONIZAÇÃO DE COTAS ---
  const checkQuotas = useCallback(async () => {
    try {
      // Adicionamos um timestamp para evitar cache do navegador
      const response = await fetch(`${API_BASE_URL}/provider-status?t=${Date.now()}`);
      if (!response.ok) throw new Error("Erro na rede");
      
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
      console.error("Erro ao sincronizar cotas:", err);
      // Fallback: Se o backend falhar, não deixa o usuário no "Consultando..."
      setProviders(prev => prev.map(p => 
        p.id === 'groq' ? { ...p, quotaLabel: 'Online' } : p
      ));
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    checkQuotas();
    // Atualiza as cotas automaticamente a cada 5 minutos
    const interval = setInterval(checkQuotas, 300000);
    return () => clearInterval(interval);
  }, [checkQuotas]);

  // Atualiza a cota EM TEMPO REAL (Streaming)
  const updateProviderQuota = useCallback((providerId, quotaInfo) => {
    if (!quotaInfo) return;
    
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        // O backend envia 'estimatedCoursesLeft', mas a rota de status envia 'available'
        const available = quotaInfo.estimatedCoursesLeft ?? quotaInfo.available;
        
        return { 
          ...p, 
          enabled: available > 0, 
          quotaLabel: available > 0 ? `${available} cursos disponíveis` : "Limite atingido"
        };
      }
      return p;
    }));
  }, []);

  const disableProvider = useCallback((providerId, message) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId 
        ? { ...p, enabled: false, quotaLabel: 'Limite Atingido' } 
        : p
    ));
    setStatusMessage(message);
  }, []);

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
        body: JSON.stringify({ topic, provider: selectedProvider }),
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

              if (data.error === "QUOTA_EXCEEDED") {
                disableProvider(data.provider || selectedProvider, data.message);
                throw new Error("QUOTA_EXCEEDED"); 
              }

              // Atualização durante o streaming (Vem do Controller via quotaUpdate ou quotaInfo)
              if (data.quotaInfo || data.quotaUpdate) {
                updateProviderQuota(selectedProvider, data.quotaInfo || data.quotaUpdate);
              }

              if (data.progress !== undefined) setProgress(data.progress);
              if (data.message) setStatusMessage(data.message);
              if (data.error) throw new Error(data.error);
            } catch (e) {
              if (e.message === "QUOTA_EXCEEDED") throw e;
              console.warn("Erro ao processar chunk de streaming", e);
            }
          }
        }
      }

      setProgress(100);
      setStatusMessage('Curso finalizado com sucesso!');
      
      // Refresh total de dados
      setInitialDataLoaded(false); 
      await fetchGlobalData(true);
      await checkQuotas(); // Sincroniza cotas finais após o curso ser salvo no Sanity

      if (callback) callback();

    } catch (error) {
      console.error("Erro na geração:", error);
      if (error.message !== "QUOTA_EXCEEDED") {
        setStatusMessage(error.message || 'Erro ao gerar curso.');
      }
    } finally {
      const delay = statusMessage.includes('Limite') ? 6000 : 3000;
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setStatusMessage('');
      }, delay);
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
      selectedProvider,
      setSelectedProvider,
      providers,
      checkQuotas 
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);