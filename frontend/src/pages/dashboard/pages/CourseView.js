import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client } from '../../client';
import { 
  Box, Typography, Stack, Grid, Card, CardContent, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Button, CircularProgress, Chip, Accordion, 
  AccordionSummary, AccordionDetails 
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Ícones
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import QuizIcon from '@mui/icons-material/Quiz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SidebarContainer = styled(Box)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  height: 'calc(100vh - 100px)',
  overflowY: 'auto',
  backgroundColor: theme.palette.background.paper,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 100px)',
  overflowY: 'auto',
  padding: theme.spacing(4),
}));

export default function CourseView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeLesson, setActiveLesson] = React.useState(null);
  const [completedLessons, setCompletedLessons] = React.useState([]);

  // 1. Busca os detalhes do curso no Sanity
  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        const query = `*[_type == "course" && slug.current == $slug][0]{
          _id,
          title,
          description,
          level,
          modules[]{
            title,
            lessons[]{
              title,
              content,
              duration
            },
            exercises[]{
              question,
              options,
              correctAnswer
            }
          },
          finalExam[]{
            question,
            options,
            correctAnswer
          }
        }`;
        const data = await client.fetch(query, { slug });
        
        if (data) {
          setCourse(data);
          // Define a primeira lição do primeiro módulo como ativa por padrão
          if (data.modules?.[0]?.lessons?.[0]) {
            setActiveLesson(data.modules[0].lessons[0]);
          }
          
          // Carrega progresso do localStorage
          const saved = localStorage.getItem(`progress-${data._id}`);
          if (saved) setCompletedLessons(JSON.parse(saved));
        }
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar curso:", err);
        setLoading(false);
      }
    };

    fetchCourse();
  }, [slug]);

  const toggleLessonComplete = (lessonTitle) => {
    const updated = completedLessons.includes(lessonTitle)
      ? completedLessons.filter(l => l !== lessonTitle)
      : [...completedLessons, lessonTitle];
    
    setCompletedLessons(updated);
    localStorage.setItem(`progress-${course._id}`, JSON.stringify(updated));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Curso não encontrado.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          Voltar para o Painel
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, mt: -2 }}>
      <Grid container>
        {/* SIDEBAR DE NAVEGAÇÃO */}
        <Grid item xs={12} md={4} lg={3}>
          <SidebarContainer>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                CONTEÚDO DO CURSO
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                {course.title}
              </Typography>
              <Chip label={course.level} size="small" color="secondary" sx={{ mb: 2 }} />
            </Box>
            <Divider />
            
            {course.modules?.map((module, mIdx) => (
              <Accordion key={mIdx} defaultExpanded={mIdx === 0} elevation={0} square>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight="bold" variant="body2">
                    Módulo {mIdx + 1}: {module.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List disablePadding>
                    {module.lessons?.map((lesson, lIdx) => (
                      <ListItem key={lIdx} disablePadding>
                        <ListItemButton 
                          selected={activeLesson?.title === lesson.title}
                          onClick={() => setActiveLesson(lesson)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {completedLessons.includes(lesson.title) ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText 
                            primary={lesson.title} 
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                    {/* Link para Quiz do Módulo se houver */}
                    {module.exercises?.length > 0 && (
                      <ListItem disablePadding>
                        <ListItemButton sx={{ bgcolor: 'action.hover' }}>
                          <ListItemIcon sx={{ minWidth: 36 }}><QuizIcon fontSize="small" /></ListItemIcon>
                          <ListItemText primary="Quiz do Módulo" primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} />
                        </ListItemButton>
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}

            {/* Link para Exame Final */}
            {course.finalExam?.length > 0 && (
              <Box sx={{ p: 2 }}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="secondary" 
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate(`/curso/${slug}/exame`)}
                >
                  Exame Final
                </Button>
              </Box>
            )}
          </SidebarContainer>
        </Grid>

        {/* ÁREA DE CONTEÚDO */}
        <Grid item xs={12} md={8} lg={9}>
          <ContentContainer>
            {activeLesson ? (
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h4" fontWeight="bold">
                    {activeLesson.title}
                  </Typography>
                  <Button 
                    variant={completedLessons.includes(activeLesson.title) ? "outlined" : "contained"}
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => toggleLessonComplete(activeLesson.title)}
                  >
                    {completedLessons.includes(activeLesson.title) ? "Concluída" : "Marcar como lida"}
                  </Button>
                </Box>
                
                <Divider />

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 4 }}>
                    {/* Renderização do conteúdo (Markdown ou Texto Simples) */}
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        lineHeight: 1.8, 
                        whiteSpace: 'pre-line',
                        fontSize: '1.1rem' 
                      }}
                    >
                      {activeLesson.content}
                    </Typography>
                  </CardContent>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                   <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')}>
                     Sair da Aula
                   </Button>
                   <Typography variant="caption" color="text.secondary">
                     Tempo estimado: {activeLesson.duration || '5 min'}
                   </Typography>
                </Box>
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', mt: 10 }}>
                <PlayLessonIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                <Typography variant="h5" color="text.secondary">
                  Selecione uma lição para começar a estudar.
                </Typography>
              </Box>
            )}
          </ContentContainer>
        </Grid>
      </Grid>
    </Box>
  );
}