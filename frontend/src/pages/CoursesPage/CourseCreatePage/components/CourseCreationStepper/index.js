// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\CourseCreationStepper\index.js

import React, { useState, useEffect } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  CircularProgress,
  // Removido: Alert não é usado diretamente neste componente
  Container,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import Step1BasicInfo from './components/Step1BasicInfo';
// Os próximos passos continuam comentados
// import Step2ContentStructure from './components/Step2ContentStructure';
// import Step3AdditionalSettings from './components/Step3AdditionalSettings';
// import Step4ReviewPublish from './components/Step4ReviewPublish';

function getSteps() {
  return ['Modelo de IA e Informações Básicas', 'Estrutura do Conteúdo', 'Configurações Adicionais', 'Revisão e Publicação'];
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
  const steps = getSteps();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('courseCreationFormData', JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (stepData) => {
    setFormData((prevData) => ({
      ...prevData,
      ...stepData,
    }));
  };

  function getStepContent(step) {
    switch (step) {
      case 0: 
        return <Step1BasicInfo formData={formData} updateFormData={updateFormData} onShowAlert={onShowPageAlert} />;
      default:
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                    Este passo ainda não foi implementado.
                </Typography>
                <Button onClick={handleBack} variant="outlined" sx={{ mt: 2 }}>
                    Voltar
                </Button>
            </Box>
        );
    }
  }

  const handleNext = () => {
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

      // Alterado para desestruturar 'data' diretamente, evitando o aviso de 'response' não utilizado
      const { data } = await axios.post('/api/courses', dataToSend, {
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  disabled={activeStep === 0 || loading}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                  variant="outlined"
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={loading || activeStep !== 0}
                >
                  {loading ? <CircularProgress size={24} /> : (activeStep === steps.length - 1 ? 'Publicar Curso' : 'Próximo')}
                </Button>
              </Box>
            </Box>
          )}
        </div>
      </Paper>
    </Container>
  );
};

export default CourseCreationStepper;
