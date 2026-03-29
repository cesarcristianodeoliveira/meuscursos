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

  // Ajuste para bater na porta 5000 local conforme seu backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  /**
   * Cálculo de progresso do aluno no curso (Realismo Pedagógico)
   */
  const getCourseProgress = useCallback((course) => {
    if (!course || !course._id) return 0;
    try {
      const saved = localStorage.getItem(`progress-${course._id}`);
      const completedSteps = saved ? JSON.parse(saved) : [];
      // Passos = módulos + exame final
      const totalSteps = (course.modules?.length || 0) + (course.finalExam?.length > 0 ? 1 : 0);
      
      if (totalSteps === 0) return 0;
      return Math.min(Math.round((completedSteps.length / totalSteps) * 100), 100);
    } catch (err) {
      return 0;
    }
  }, []);

  /**
   * Verifica status das APIs e limites de geração
   */
  const checkQuotas = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/provider-status?t=${Date.now()}`);
      if (!response.ok) throw new Error("Status indisponível");
      const data = await response.json();

      setProviders(prev => prev.map(p => data[p.id] ? { 
        ...p, 
        enabled: data[p.id].enabled,
        quotaLabel: data[p.id].message 
      } : p));
    } catch (err) {
      console.warn("⚠️ Não foi possível verificar cotas:", err.message);
      // Fallback visual
      setProviders(prev => prev.map(p => p.id === 'groq' ? { ...p, quotaLabel: 'Online' } : p));
    }
  }, [API_BASE_URL]);

  /**
   * Busca categorias e números globais do Sanity para o Dashboard
   */
  const fetchGlobalData = useCallback(async (force = false) => {
    if (initialDataLoaded && !force) return;
    try {
      const query = `{
        "stats": {
          "courses": count(*[_type == "course"]),
          "categories": count(array::unique(*[_type == "course" && defined(category.name)].category.name)),
          "lessons": count(*[_type == "course"].modules[]),
          "quizzes": count(*[_type == "course"].modules[].exercises[])
        },
        "cats": array::unique(*[_type == "course" && defined(category.name)].category.name)
      }`;
      const data = await client.fetch(query);
      const uniqueCats = (data.cats || []).filter(Boolean);
      const sortedCats = ['Recentes', ...uniqueCats.sort((a, b) => a.localeCompare(b))];

      setStats(data.stats || { courses: 0, lessons: 0, quizzes: 0, categories: 0 });
      setCategories(sortedCats);
      setInitialDataLoaded(true);
    } catch (err) {
      console.error("❌ Erro Sanity fetchGlobalData:", err);
    }
  }, [initialDataLoaded]);

  useEffect(() => {
    fetchGlobalData();
    checkQuotas();
    const interval = setInterval(checkQuotas, 300000); // 5 min
    return () => clearInterval(interval);
  }, [checkQuotas, fetchGlobalData]);

  /**
   * Gerador de Cursos com Suporte a Streaming (SSE)
   */
  const generateCourse = async (topic, userId, onFinish) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(5); 
    setStatusMessage(`O Professor IA está analisando: ${topic}...`);

    let finalSlug = null;

    try {
      const response = await fetch(`${API_BASE_URL}/generate-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, provider: selectedProvider, userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = "Erro ao conectar com o servidor.";
        try {
          const parsedError = JSON.parse(errorText);
          errorMsg = parsedError.message || errorMsg;
        } catch (e) {
            // Se não for JSON, usa o texto bruto ou status
            errorMsg = `Erro ${response.status}: Limite atingido ou servidor offline.`;
        }
        throw new Error(errorMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Mantém fragmentos no buffer

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(cleanLine.replace('data: ', ''));

            if (data.error) throw new Error(data.message || "Erro na geração.");
            if (data.progress !== undefined) setProgress(data.progress);
            if (data.message) setStatusMessage(data.message);
            if (data.slug) finalSlug = data.slug;
            
          } catch (e) {
            console.error("Erro ao ler chunk:", e);
          }
        }
      }

      // Finalização com sucesso
      setProgress(100);
      setStatusMessage('Curso criado com sucesso! Preparando sala de aula...');
      
      // Atualiza dados locais para refletir o novo curso e créditos usados
      await fetchGlobalData(true);
      checkQuotas(); 

      // Pequeno delay para o usuário ver o "100%"
      setTimeout(() => {
        if (onFinish && finalSlug) {
          onFinish(finalSlug);
        }
        setIsGenerating(false);
        setProgress(0);
      }, 2000);

    } catch (error) {
      console.error("❌ Erro GenerateCourse:", error);
      setStatusMessage(error.message);
      
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 5000);
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
      checkQuotas,
      setIsGenerating,
      hasPagination: stats.courses > COURSES_PER_PAGE
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);