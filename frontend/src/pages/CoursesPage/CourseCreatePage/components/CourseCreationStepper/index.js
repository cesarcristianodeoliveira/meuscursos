// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\CourseCreationStepper\index.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Typography,
  Box,
  Container,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MobileStepper from '@mui/material/MobileStepper';
import CircularProgress from '@mui/material/CircularProgress';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import Step1AIModelSelection from './components/Step1AIModelSelection';
import Step2BasicInfo from './components/Step2BasicInfo';
// import Step3AdditionalSettings from './components/Step3AdditionalSettings';
// import Step4ReviewPublish from './components/Step4ReviewPublish';

// Define os rótulos e descrições dos passos para o MobileStepper
const stepsData = [
  {
    label: 'Selecione o Modelo de IA',
    description: 'Selecione o modelo de inteligência artificial para gerar o conteúdo do curso.',
  },
  {
    label: 'Informações Básicas',
    description: 'Defina o título, descrição, categoria e outros dados essenciais do curso.',
  },
  {
    label: 'Estrutura do Conteúdo',
    description: 'Crie os módulos e aulas que compõem o curso.',
  },
  {
    label: 'Revisão e Publicação',
    description: 'Revise todos os detalhes e publique seu curso.',
  },
];

const CourseCreationStepper = ({ onShowPageAlert }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('courseCreationFormData');
    
    const initialData = savedData ? JSON.parse(savedData) : {
      title: '',
      slug: { _type: 'slug', current: '' },
      description: '',
      mainImage: { asset: { _ref: '', _type: 'reference' } }, 
      video: null,
      category: { _ref: '', _type: 'reference' },
      subCategory: { _ref: '', _type: 'reference' },
      courseTags: [],
      level: 'beginner',
      estimatedDuration: 0,
      language: 'pt',
      status: 'draft',
      price: 0,
      isPro: false,
      creator: { _ref: '', _type: 'reference' },
      lessons: [],
      aiGenerationPrompt: '',
      aiModelUsed: '',
      generatedAt: '',
      lastGenerationRevision: '',
      prerequisites: [], 
    };

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id || decodedToken.sub; 
        if (userId) {
          initialData.creator = { _ref: userId, _type: 'reference' };
        }
      } catch (error) {
        console.error("Erro ao decodificar o token:", error);
        localStorage.removeItem('token');
      }
    }
    return initialData;
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const maxSteps = stepsData.length;

  useEffect(() => {
    localStorage.setItem('courseCreationFormData', JSON.stringify(formData));
  }, [formData]);

  const updateFormData = useCallback((stepData) => {
    setFormData((prevData) => ({
      ...prevData,
      ...stepData,
    }));
  }, []);

  function getStepContent(step) {
    switch (step) {
      case 0: 
        return <Step1AIModelSelection formData={formData} updateFormData={updateFormData} onShowAlert={onShowPageAlert} />;
      case 1:
        return <Step2BasicInfo formData={formData} updateFormData={updateFormData} onShowAlert={onShowPageAlert} />;
      // case 2:
      //   return <Step3AdditionalSettings formData={formData} updateFormData={updateFormData} onShowAlert={onShowPageAlert} />;
      // case 3:
      //   return <Step4ReviewPublish formData={formData} onShowAlert={onShowPageAlert} />;
      default:
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                    Este passo ainda não foi implementado.
                </Typography>
            </Box>
        );
    }
  }

  const handleNext = () => {
    if (activeStep === 0 && !formData.aiModelUsed) {
      onShowPageAlert('Por favor, selecione um modelo de IA para continuar.', 'error');
      return; 
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        onShowPageAlert('Usuário não autenticado. Faça login novamente.', 'error');
        navigate('/entrar');
        return;
      }

      const dataToSend = { ...formData };
      
      if (dataToSend.slug && dataToSend.slug.current) {
        dataToSend.slug = { _type: 'slug', current: dataToSend.slug.current };
      } else {
        delete dataToSend.slug;
      }

      if (dataToSend.mainImage && dataToSend.mainImage.asset && dataToSend.mainImage.asset._ref) {
        dataToSend.mainImageId = dataToSend.mainImage.asset._ref; 
        delete dataToSend.mainImage;
      }

      await axios.post('/api/courses', dataToSend, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      onShowPageAlert('Curso criado com sucesso!', 'success');
      localStorage.removeItem('courseCreationFormData');
      navigate('/dashboard/my-courses');
    } catch (err) {
      console.error('Erro ao submeter o curso:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Ocorreu um erro inesperado ao criar o curso.';
      onShowPageAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
        {/* Título do passo atual */}
        <Paper
          square
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 50,
            pl: 2,
            bgcolor: 'background.default',
            justifyContent: 'center', // Garante que o rótulo do passo esteja centralizado
            mb: 2,
          }}
        >
          <Typography variant="h6">{stepsData[activeStep].label}</Typography>
        </Paper>

        {/* Conteúdo do passo atual */}
        <Box sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {getStepContent(activeStep)}
        </Box>
        
        {/* MobileStepper para navegação */}
        <MobileStepper
          variant="text" // Mantém o variant="text" para o rótulo do passo
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{ maxWidth: '100%', flexGrow: 1, mt: 4 }}
          nextButton={
            <Button
              size="small"
              onClick={activeStep === maxSteps - 1 ? handleSubmit : handleNext}
              disabled={
                loading ||
                (activeStep === maxSteps - 1) ||
                (activeStep === 0 && !formData.aiModelUsed) // Desabilita se no passo 0 e sem modelo de IA
              }
            >
              {loading && activeStep === maxSteps - 1 ? <CircularProgress size={24} /> : (activeStep === maxSteps - 1 ? 'Publicar Curso' : 'Próximo')}
              {theme.direction === 'rtl' ? (
                <KeyboardArrowLeft />
              ) : (
                <KeyboardArrowRight />
              )}
            </Button>
          }
          backButton={
            // Renderiza um Box invisível com a mesma largura do botão "Próximo" para manter a centralização
            <Box sx={{ width: '80px', visibility: activeStep === 0 ? 'hidden' : 'visible' }}>
              <Button size="small" onClick={handleBack} disabled={loading || activeStep === 0}>
                {theme.direction === 'rtl' ? (
                  <KeyboardArrowRight />
                ) : (
                  <KeyboardArrowLeft />
                )}
                Voltar
              </Button>
            </Box>
          }
        />
        {/* Overlay de loading geral */}
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(255, 255, 255, 0.7)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            zIndex: 1000
          }}>
            <CircularProgress />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CourseCreationStepper;
