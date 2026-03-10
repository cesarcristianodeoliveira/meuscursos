import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const getCourseProgress = useCallback((course) => {
    if (!course) return 0;
    
    const saved = localStorage.getItem(`progress-${course._id}`);
    const completedSteps = saved ? JSON.parse(saved) : [];
    
    const totalSteps = (course.modules?.length || 0) + (course.finalExam ? 1 : 0);
    
    if (totalSteps === 0) return 0;
    
    return Math.round((completedSteps.length / totalSteps) * 100);
  }, []);

  const generateCourse = async (topic, callback) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setStatusMessage('Iniciando conexão com a IA...');

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setStatusMessage('Pesquisando referências técnicas...');
          return prev + 1;
        }
        if (prev < 60) {
          setStatusMessage('Estruturando módulos e exercícios...');
          return prev + 0.5;
        }
        if (prev < 90) {
          setStatusMessage('Finalizando provas e gerando imagens...');
          return prev + 0.2;
        }
        return prev;
      });
    }, 500);

    try {
      await axios.post(`${API_BASE_URL}/generate-course`, { topic });
      setProgress(100);
      setStatusMessage('Curso pronto!');
      
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
      getCourseProgress 
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => useContext(CourseContext);