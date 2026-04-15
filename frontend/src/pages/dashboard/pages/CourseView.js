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
import LockIcon from '@mui/icons-material/Lock';

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

          // Só busca progresso do banco se houver usuário logado
          if (user?._id) {
            try {
              const res = await api.get(`/courses/${data._id}/progress`);
              if (res.data.success) {
                setCompletedLessons(res.data.completedLessons || []);
              }
            } catch (err) {
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
      alert("Faça login para salvar seu progresso!");
      navigate('/login');
      return;
    }

    const lessonId = lesson._key || lesson.title;
    const isCompleted = completedLessons.includes(lessonId);
    const updated = isCompleted
      ? completedLessons.filter(l => l !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(updated);

    try {
      setSaveError(null);
      await api.post(`/courses/${course._id}/progress`, {
        lessonId: lessonId,
        completed: !isCompleted
      });
    } catch (err) {
      setSaveError("Erro ao sincronizar com o servidor.");
    }
  };

  if (loading || authLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  if (!course) return <Typography sx={{ p: 4 }}>Curso não encontrado.</Typography>;

  return (
    <Box sx={{ flexGrow: 1, mt: -2 }}>
      {saveError && <Alert severity="warning">{saveError}</Alert>}
      
      <Grid container>
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
                  <Typography fontWeight="bold" variant="body2">Módulo {mIdx + 1}: {module.title}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List disablePadding>
                    {module.lessons?.map((lesson, lIdx) => (
                      <ListItem key={lIdx} disablePadding>
                        <ListItemButton 
                          selected={activeLesson?._key === lesson._key}
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
                    
                    {module.exercises?.length > 0 && (
                      <ListItem disablePadding>
                        <ListItemButton 
                          sx={{ bgcolor: 'action.hover' }}
                          onClick={() => user ? navigate(`/curso/${slug}/quiz/${module._key || mIdx}`) : navigate('/login')}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {user ? <QuizIcon color="primary" fontSize="small" /> : <LockIcon fontSize="small" />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={user ? "Fazer Quiz" : "Login para Quiz"} 
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
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                      {activeLesson.content}
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            ) : (
              <Typography variant="h5" textAlign="center" mt={10}>Selecione uma lição.</Typography>
            )}
          </ContentContainer>
        </Grid>
      </Grid>
    </Box>
  );
}