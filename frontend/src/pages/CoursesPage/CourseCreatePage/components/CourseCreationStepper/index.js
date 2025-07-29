// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\CourseCreationStepper\index.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  // Removido CircularProgress e IconButton das importações diretas,
  // pois serão usados dentro dos componentes Button do MobileStepper
  Button,
  Typography,
  Box,
  Container,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MobileStepper from '@mui/material/MobileStepper';
import CircularProgress from '@mui/material/CircularProgress'; // Mantido aqui para uso no botão
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft'; // Ícone de seta para a esquerda
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight'; // Ícone de seta para a direita

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Importa o componente do Step1 com o novo nome
import Step1AIModelSelection from './components/Step1AIModelSelection';
// Os próximos passos continuam comentados
// import Step2ContentStructure from './components/Step2ContentStructure';
// import Step3AdditionalSettings from './components/3AdditionalSettings';
// import Step4ReviewPublish from './components/Step4ReviewPublish';

// Define os rótulos e descrições dos passos para o MobileStepper
const stepsData = [
  {
    label: 'Modelo de IA',
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
    // Validação para o primeiro passo: Modelo de IA deve ser selecionado
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

      // A resposta não precisa ser desestruturada se não for usada.
      // Apenas aguarde a conclusão da requisição.
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
            justifyContent: 'center',
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
          variant="text"
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{ maxWidth: '100%', flexGrow: 1, mt: 4 }}
          nextButton={
            <Button
              size="small"
              onClick={activeStep === maxSteps - 1 ? handleSubmit : handleNext} // Lógica de submissão no último passo
              disabled={activeStep === maxSteps - 1 && loading ? true : (activeStep === maxSteps - 1 ? false : (activeStep === 0 && !formData.aiModelUsed))} // Ajuste da lógica de desabilitação
            >
              {loading ? <CircularProgress size={24} /> : (activeStep === maxSteps - 1 ? 'Publicar Curso' : 'Próximo')}
              {theme.direction === 'rtl' ? (
                <KeyboardArrowLeft />
              ) : (
                <KeyboardArrowRight />
              )}
            </Button>
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0 || loading}>
              {theme.direction === 'rtl' ? (
                <KeyboardArrowRight />
              ) : (
                <KeyboardArrowLeft />
              )}
              Voltar
            </Button>
          }
        />
      </Paper>
    </Container>
  );
};

export default CourseCreationStepper;
