import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client } from '../../../client';
import api from '../../../services/api'; 
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, Typography, Stack, Grid, Card, CardContent, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Button, CircularProgress, Chip, Accordion, 
  AccordionSummary, AccordionDetails, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import QuizIcon from '@mui/icons-material/Quiz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
  const { user, authLoading } = useAuth(); 

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeLesson, setActiveLesson] = React.useState(null);
  const [completedLessons, setCompletedLessons] = React.useState([]);
  const [saveError, setSaveError] = React.useState(null);

  React.useEffect(() => {
    const fetchCourseAndProgress = async () => {
      try {
        const query = `*[_type == "course" && slug.current == $slug][0]{
          _id, title, description, level,
          modules[]{
            _key, title,
            lessons[]{ _key, title, content, duration },
            exercises[]{ _key, question, options, correctAnswer }
          }
        }`;
        const data = await client.fetch(query, { slug });

        if (data) {
          setCourse(data);
          if (data.modules?.[0]?.lessons?.[0]) {
            setActiveLesson(data.modules[0].lessons[0]);
          }

          // Busca progresso real do backend usando o _id do curso
          if (user?._id) {
            try {
              const res = await api.get(`/courses/${data._id}/progress`);
              if (res.data.success) {
                setCompletedLessons(res.data.completedLessons || []);
              }
            } catch (err) {
              console.warn("Usando progresso local (offline)");
              const saved = localStorage.getItem(`progress-${data._id}`);
              if (saved) setCompletedLessons(JSON.parse(saved));
            }
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar curso:", err);
        setLoading(false);
      }
    };

    if (!authLoading) fetchCourseAndProgress();
  }, [slug, authLoading, user?._id]);

  const toggleLessonComplete = async (lesson) => {
    if (!user) {
      navigate('/entrar');
      return;
    }

    const lessonId = lesson._key || lesson.title;
    const isCompleted = completedLessons.includes(lessonId);
    
    // Atualização otimista da UI
    const updated = isCompleted
      ? completedLessons.filter(l => l !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(updated);
    localStorage.setItem(`progress-${course._id}`, JSON.stringify(updated));

    try {
      setSaveError(null);
      await api.post(`/courses/${course._id}/progress`, {
        lessonId: lessonId,
        completed: !isCompleted
      });
    } catch (err) {
      setSaveError("Erro ao sincronizar progresso com o servidor.");
    }
  };

  if (loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!course) return <Typography sx={{ p: 4 }}>Curso não encontrado.</Typography>;

  return (
    <Box sx={{ flexGrow: 1, mt: -2 }}>
      {saveError && (
        <Alert severity="error" onClose={() => setSaveError(null)} sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}
      
      <Grid container>
        {/* Sidebar de Módulos */}
        <Grid item xs={12} md={4} lg={3}>
          <SidebarContainer>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="bold" noWrap>{course.title}</Typography>
              <Chip label={course.level} size="small" color="primary" sx={{ mt: 1, textTransform: 'capitalize' }} />
            </Box>
            <Divider />

            {course.modules?.map((module, mIdx) => (
              <Accordion key={module._key || mIdx} defaultExpanded={mIdx === 0} elevation={0} square>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight="bold" variant="body2">
                    {mIdx + 1}. {module.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List disablePadding>
                    {module.lessons?.map((lesson, lIdx) => {
                      const lKey = lesson._key || lesson.title;
                      const isDone = completedLessons.includes(lKey);
                      return (
                        <ListItem key={lesson._key || lIdx} disablePadding>
                          <ListItemButton 
                            selected={activeLesson?._key === lesson._key}
                            onClick={() => setActiveLesson(lesson)}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {isDone ? <CheckCircleIcon color="success" fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                            </ListItemIcon>
                            <ListItemText primary={lesson.title} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                    
                    {module.exercises?.length > 0 && (
                      <ListItem disablePadding>
                        <ListItemButton 
                          sx={{ bgcolor: (theme) => theme.palette.action.hover }}
                          onClick={() => navigate(`/dashboard/curso/${slug}/quiz/${module._key || mIdx}`)}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <QuizIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Desafio do Módulo" 
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

        {/* Área de Conteúdo */}
        <Grid item xs={12} md={8} lg={9}>
          <ContentContainer>
            {activeLesson ? (
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h4" fontWeight="bold">{activeLesson.title}</Typography>
                  <Button 
                    variant={completedLessons.includes(activeLesson._key || activeLesson.title) ? "outlined" : "contained"}
                    color="success"
                    startIcon={completedLessons.includes(activeLesson._key || activeLesson.title) ? <CheckCircleIcon /> : null}
                    onClick={() => toggleLessonComplete(activeLesson)}
                  >
                    {completedLessons.includes(activeLesson._key || activeLesson.title) ? "Concluída" : "Concluir Aula"}
                  </Button>
                </Box>
                <Divider />
                <Card variant="outlined" sx={{ borderRadius: 2, border: 'none', bgcolor: 'transparent' }}>
                  <CardContent sx={{ p: 0 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.primary' }}>
                      {activeLesson.content}
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h5" color="text.secondary">Selecione uma aula no menu lateral para começar.</Typography>
              </Box>
            )}
          </ContentContainer>
        </Grid>
      </Grid>
    </Box>
  );
}