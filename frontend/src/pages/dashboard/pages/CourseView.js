import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client } from '../../../client';
import api from '../../../services/api'; // Importante para salvar no MongoDB
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, Typography, Stack, Grid, Card, CardContent, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Button, CircularProgress, Chip, Accordion, 
  AccordionSummary, AccordionDetails, Alert
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
  const { user } = useAuth();

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeLesson, setActiveLesson] = React.useState(null);
  const [completedLessons, setCompletedLessons] = React.useState([]);
  const [saveError, setSaveError] = React.useState(null);

  // 1. Busca os detalhes do curso e o progresso real do banco
  React.useEffect(() => {
    const fetchCourseAndProgress = async () => {
      try {
        const query = `*[_type == "course" && slug.current == $slug][0]{
          _id,
          title,
          description,
          level,
          modules[]{
            _key,
            title,
            lessons[]{
              _key,
              title,
              content,
              duration
            },
            exercises[]{
              _key,
              question,
              options,
              correctAnswer
            }
          },
          finalExam[]{
            _key,
            question,
            options,
            correctAnswer
          }
        }`;
        const data = await client.fetch(query, { slug });

        if (data) {
          setCourse(data);
          if (data.modules?.[0]?.lessons?.[0]) {
            setActiveLesson(data.modules[0].lessons[0]);
          }

          // BUSCA PROGRESSO DO BACKEND (MongoDB)
          try {
            const res = await api.get(`/courses/${data._id}/progress`);
            if (res.data.success) {
              setCompletedLessons(res.data.completedLessons || []);
            }
          } catch (err) {
            console.log("Sem progresso prévio no servidor, usando local.");
            const saved = localStorage.getItem(`progress-${data._id}`);
            if (saved) setCompletedLessons(JSON.parse(saved));
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar curso:", err);
        setLoading(false);
      }
    };

    fetchCourseAndProgress();
  }, [slug]);

  // 2. Função para salvar progresso no MongoDB e LocalStorage
  const toggleLessonComplete = async (lesson) => {
    const lessonId = lesson._key || lesson.title;
    const isCompleted = completedLessons.includes(lessonId);
    
    const updated = isCompleted
      ? completedLessons.filter(l => l !== lessonId)
      : [...completedLessons, lessonId];

    // Atualiza estado local para resposta instantânea na UI
    setCompletedLessons(updated);
    localStorage.setItem(`progress-${course._id}`, JSON.stringify(updated));

    try {
      setSaveError(null);
      // ENVIA PARA O BACKEND
      await api.post(`/courses/${course._id}/progress`, {
        lessonId: lessonId,
        completed: !isCompleted
      });
    } catch (err) {
      console.error("Erro ao salvar progresso no servidor:", err);
      setSaveError("Progresso salvo apenas localmente. Verifique sua conexão.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!course) return <Typography>Curso não encontrado.</Typography>;

  return (
    <Box sx={{ flexGrow: 1, mt: -2 }}>
      {saveError && (
        <Alert severity="warning" onClose={() => setSaveError(null)} sx={{ borderRadius: 0 }}>
          {saveError}
        </Alert>
      )}
      
      <Grid container>
        {/* SIDEBAR */}
        <Grid item xs={12} md={4} lg={3}>
          <SidebarContainer>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="bold">{course.title}</Typography>
              <Chip label={course.level} size="small" color="primary" sx={{ mt: 1 }} />
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
                            {completedLessons.includes(lesson._key || lesson.title) ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText primary={lesson.title} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                    
                    {/* Botão de Quiz Ativo */}
                    {module.exercises?.length > 0 && (
                      <ListItem disablePadding>
                        <ListItemButton 
                          sx={{ bgcolor: 'action.hover' }}
                          onClick={() => navigate(`/curso/${slug}/quiz/${module._key || mIdx}`)}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}><QuizIcon color="primary" fontSize="small" /></ListItemIcon>
                          <ListItemText 
                            primary="Fazer Quiz do Módulo" 
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} 
                          />
                        </ListItemButton>
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </SidebarContainer>
        </Grid>

        {/* CONTEÚDO */}
        <Grid item xs={12} md={8} lg={9}>
          <ContentContainer>
            {activeLesson ? (
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h4" fontWeight="bold">{activeLesson.title}</Typography>
                  <Button 
                    variant={completedLessons.includes(activeLesson._key || activeLesson.title) ? "outlined" : "contained"}
                    color="success"
                    onClick={() => toggleLessonComplete(activeLesson)}
                  >
                    {completedLessons.includes(activeLesson._key || activeLesson.title) ? "Concluída" : "Concluir Aula"}
                  </Button>
                </Box>
                <Divider />
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {activeLesson.content}
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            ) : (
              <Typography>Selecione uma aula.</Typography>
            )}
          </ContentContainer>
        </Grid>
      </Grid>
    </Box>
  );
}