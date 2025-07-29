import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Typography,
  Container,
  Box,
  CardMedia,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import client, { urlFor } from '../../../../sanity'; // Ajuste o caminho se for diferente

// Importe para renderizar Portable Text (instale: npm install @sanity/block-content-to-react)
import BlockContent from '@sanity/block-content-to-react'; 

// Opcional: Configuração para o BlockContent, se quiser customizar renderização de blocos
const serializers = {
  types: {
    codeBlock: ({node}) => ( // Se você tiver um tipo 'codeBlock' em seu Portable Text
      <pre data-language={node.language}>
        <code>{node.code}</code>
      </pre>
    ),
    // Outros tipos customizados ou para imagens inline
    image: ({ node }) => (
      <img
        src={urlFor(node).url()}
        alt={node.alt || 'Imagem da lição'}
        style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '1em auto' }}
      />
    ),
  },
  // Você pode adicionar mais customizações para marks, etc.
};


function LessonPage() {
  const { courseSlug, lessonSlug } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLessonsForCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query GROQ para buscar o curso e suas lições ordenadas pelo 'order'
        const query = `*[_type == "course" && slug.current == $courseSlug][0]{
          title,
          "lessons": lessons[]->{
            _id,
            title,
            "slug": slug.current,
            order,
            content, // Traz o Portable Text
            mainMedia {
              asset->{
                _id,
                url
              }
            },
            estimatedReadingTime
          } | order(order asc) // Garante que as lições vêm na ordem correta
        }`;
        
        const courseData = await client.fetch(query, { courseSlug });
        
        if (courseData && courseData.lessons) {
          setCourseTitle(courseData.title);
          setLessons(courseData.lessons);

          // Encontrar o índice da lição atual com base no lessonSlug da URL
          const initialStep = courseData.lessons.findIndex(lesson => lesson.slug === lessonSlug);
          if (initialStep !== -1) {
            setActiveStep(initialStep);
          } else {
            // Se o lessonSlug da URL não corresponder, tenta ir para a primeira lição
            setActiveStep(0);
            // Opcional: Redirecionar para a URL da primeira lição se a URL atual for inválida
            // history.replace(`/cursos/${courseSlug}/lessons/${courseData.lessons[0].slug}`);
          }
        } else {
          setError("Curso ou lições não encontrados.");
        }
      } catch (err) {
        console.error("Erro ao buscar lições:", err);
        setError("Não foi possível carregar as lições. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchLessonsForCourse();
  }, [courseSlug, lessonSlug]); // Depende do courseSlug e lessonSlug da URL

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const isLastStep = activeStep === (lessons.length - 1);
  const currentLesson = lessons[activeStep];

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="contained" component={Link} to={`/cursos/${courseSlug}`}>
            Voltar para os detalhes do Curso
          </Button>
        </Box>
      </Container>
    );
  }

  if (!courseTitle || lessons.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="warning">Nenhuma lição encontrada para este curso.</Alert>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="contained" component={Link} to={`/cursos/${courseSlug}`}>
            Voltar para os detalhes do Curso
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to={`/cursos/${courseSlug}`}
          startIcon={<ChevronLeftIcon />}
          variant="outlined"
        >
          Voltar para Detalhes do Curso
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Curso: {courseTitle}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, borderRight: { md: '1px solid #eee' } }}>
            <Typography variant="h6" gutterBottom>
              Progresso do Curso
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {lessons.map((step, index) => (
                <Step key={step._id || index}>
                  <StepLabel
                    // Ao clicar no label, navega para a lição correspondente
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Typography>
                      {step.title}
                      {step.estimatedReadingTime && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({step.estimatedReadingTime} min)
                        </Typography>
                      )}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.content && step.content[0] && step.content[0].children[0] && step.content[0].children[0].text.substring(0, 100)}...
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <div>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          sx={{ mt: 1, mr: 1 }}
                          disabled={isLastStep}
                        >
                          {isLastStep ? 'Concluir Curso' : 'Próxima Lição'}
                        </Button>
                        <Button
                          disabled={activeStep === 0}
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Voltar
                        </Button>
                      </div>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {activeStep === lessons.length && lessons.length > 0 && (
              <Paper square elevation={0} sx={{ p: 3, mt: 2 }}>
                <Typography>Você concluiu todas as lições!</Typography>
                <Button onClick={() => setActiveStep(0)} sx={{ mt: 2, mr: 1 }}>
                  Reiniciar Curso
                </Button>
                <Button component={Link} to={`/cursos/${courseSlug}`} sx={{ mt: 2 }}>
                  Voltar para o Curso
                </Button>
              </Paper>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              {currentLesson ? currentLesson.title : 'Conteúdo da Lição'}
            </Typography>
            {currentLesson && currentLesson.mainMedia && (
              <CardMedia
                component="img"
                image={urlFor(currentLesson.mainMedia).url()}
                alt={currentLesson.title}
                sx={{
                  maxWidth: '100%',
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: '8px',
                  mb: 3
                }}
              />
            )}
            {/* Renderiza o Portable Text aqui */}
            {currentLesson && currentLesson.content && (
              <BlockContent
                blocks={currentLesson.content}
                projectId={client.projectId}
                dataset={client.dataset}
                serializers={serializers} // Opcional, para renderização customizada
              />
            )}
            {!currentLesson && (
                <Typography variant="body1">Selecione uma lição para começar.</Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default LessonPage;