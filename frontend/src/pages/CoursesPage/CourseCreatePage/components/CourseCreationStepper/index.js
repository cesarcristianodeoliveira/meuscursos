// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\CourseCreationStepper\index.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  CircularProgress,
  Container,
  Paper,
  IconButton, // Importa IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Importa ícones de seta
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Importa o componente do Step1 com o novo nome
import Step1AIModelSelection from './components/Step1AIModelSelection';
// Os próximos passos continuam comentados
// import Step2ContentStructure from './components/Step2ContentStructure';
// import Step3AdditionalSettings from './components/Step3AdditionalSettings';
// import Step4ReviewPublish from './components/Step4ReviewPublish';

function getSteps() {
  // Rótulos dos passos atualizados
  return ['Modelo de IA', 'Informações Básicas', 'Estrutura do Conteúdo', 'Revisão e Publicação'];
}

const CourseCreationStepper = ({ onShowPageAlert }) => {
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
      aiModelUsed: '', // Campo para o modelo de IA selecionado
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
  const steps = getSteps();
  const navigate = useNavigate();

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
      // Os outros passos serão implementados em breve
      // case 1:
      //   return <Step2ContentStructure formData={formData} updateFormData={updateFormData} onShowAlert={onShowPageAlert} />;
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
                {/* O botão "Voltar" já está na navegação principal, então não precisamos dele aqui */}
            </Box>
        );
    }
  }

  const handleNext = () => {
    // TODO: Adicionar validação específica para cada passo aqui se necessário
    // Por exemplo, para o Step1AIModelSelection:
    if (activeStep === 0 && !formData.aiModelUsed) {
      onShowPageAlert('Por favor, selecione um modelo de IA para continuar.', 'error');
      return; // Impede o avanço se não houver modelo selecionado
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
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Criar Novo Curso
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <div>
          {activeStep === steps.length ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
              {loading && <CircularProgress sx={{ mb: 2 }} />}
              <Typography variant="h5" sx={{ mb: 2 }}>
                Finalizando a criação do curso...
              </Typography>
              <Button onClick={() => navigate('/dashboard/my-courses')} variant="contained">
                Ir para Meus Cursos
              </Button>
            </Box>
          ) : (
            <Box>
              {getStepContent(activeStep)}
              
              {/* Controles de Navegação com Ícones */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
                <IconButton
                  onClick={handleBack}
                  disabled={activeStep === 0 || loading}
                  color="primary"
                  aria-label="Voltar"
                >
                  <ArrowBackIosIcon />
                </IconButton>
                
                {/* Rótulo do passo no centro (opcional, já está no Stepper acima) */}
                {/* <Typography variant="body1" sx={{ mx: 2 }}>
                  {steps[activeStep]}
                </Typography> */}

                <Button
                  variant="contained"
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={loading || activeStep === steps.length -1 || !formData.aiModelUsed} // Desabilita "Próximo" se não for o último passo e o modelo de IA não estiver selecionado
                  sx={{ flexGrow: 1, mx: 2 }} // Ocupa espaço entre os botões de navegação
                >
                  {loading ? <CircularProgress size={24} /> : (activeStep === steps.length - 1 ? 'Publicar Curso' : 'Próximo')}
                </Button>

                <IconButton
                  onClick={handleNext}
                  disabled={activeStep === steps.length - 1 || loading || !formData.aiModelUsed} // Desabilita se for o último passo ou modelo de IA não selecionado
                  color="primary"
                  aria-label="Próximo"
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </div>
      </Paper>
    </Container>
  );
};

export default CourseCreationStepper;
