import React, { useState } from 'react';
import {
  Typography,
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { Link /* Removido useNavigate aqui, se não for usar 'navigate' */ } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

function CourseCreatePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [courseTopic, setCourseTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  // const navigate = useNavigate(); // <-- Linha comentada/removida para resolver o warning

  const steps = [
    {
      label: 'Detalhes do Curso',
      description: 'Informe o tópico principal para o novo curso. A IA usará isso para gerar o conteúdo.'
    },
    {
      label: 'Gerar Conteúdo',
      description: 'Revise o tópico e inicie a geração do curso pela IA. Isso pode levar alguns segundos.'
    },
    {
      label: 'Concluído',
      description: 'O curso foi gerado e salvo no Sanity CMS!'
    },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // const handleBack = () => { // <-- Função removida para resolver o warning
  //   setActiveStep((prevActiveStep) => prevActiveStep + 1); // Bug fix: should be prevActiveStep - 1
  // };

  // Correção da função handleBack para realmente voltar ao passo anterior
  const handleBackCorrected = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setCourseTopic('');
    setLoading(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleGenerateCourse = async () => {
    if (!courseTopic.trim()) {
      setError('Por favor, insira um tópico para o curso.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: courseTopic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o curso no backend.');
      }

      const result = await response.json();
      console.log('Curso gerado com sucesso:', result);
      setSuccessMessage('Curso e lições gerados e salvos com sucesso no Sanity CMS! 🎉');
      handleNext(); // Avança para o passo 'Concluído'

    } catch (err) {
      console.error("Erro ao gerar curso:", err);
      setError(`Erro ao gerar curso: ${err.message}. Verifique o console do backend.`);
      setLoading(false); // Permite tentar novamente no mesmo passo
    } finally {
      // setLoading(false); // Já é feito acima se for erro
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to="/cursos" // Link para a página de listagem de cursos
          startIcon={<ChevronLeftIcon />}
          variant="outlined"
        >
          Voltar para a Lista de Cursos
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Crie um Novo Curso com IA
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel optional={index === 2 ? <Typography variant="caption">Conclusão</Typography> : null}>
              {step.label}
            </StepLabel>
            <StepContent>
              <Typography>{step.description}</Typography>
              <Box sx={{ mb: 2 }}>
                {/* Conteúdo de cada passo */}
                {index === 0 && (
                  <TextField
                    label="Tópico do Curso (ex: 'Introdução à Programação com Python')"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={courseTopic}
                    onChange={(e) => setCourseTopic(e.target.value)}
                    disabled={loading}
                  />
                )}
                {index === 1 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Tópico Escolhido: <br/>
                      <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        "{courseTopic || 'Nenhum tópico inserido'}"
                      </Box>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Ao clicar em "Gerar Curso Agora", a inteligência artificial irá criar o curso e suas lições. Este processo pode levar alguns segundos.
                    </Typography>
                  </Box>
                )}

                {/* Botões de navegação */}
                <div>
                  <Button
                    variant="contained"
                    onClick={index === 1 ? handleGenerateCourse : handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={
                      loading ||
                      (index === 0 && !courseTopic.trim()) ||
                      (index === 1 && loading)
                    }
                    startIcon={index === 1 && loading ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {index === 1 ? (loading ? 'Gerando...' : 'Gerar Curso Agora') : 'Próximo'}
                  </Button>
                  <Button
                    disabled={index === 0 || loading}
                    onClick={handleBackCorrected} // Usando a função corrigida
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Voltar
                  </Button>
                </div>
                {loading && index === 1 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Aguarde, a IA está trabalhando...
                  </Typography>
                )}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
            {successMessage || 'Processo de criação concluído!'}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
            Criar Outro Curso
          </Button>
          <Button component={Link} to="/cursos" variant="contained" sx={{ mt: 1 }}>
            Ver Todos os Cursos
          </Button>
        </Paper>
      )}
    </Container>
  );
}

export default CourseCreatePage;