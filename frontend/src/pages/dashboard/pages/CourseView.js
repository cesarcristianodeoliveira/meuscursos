import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; // Certifique-se de instalar: npm install react-markdown
import { client } from '../../../client';
import api from '../../../services/api'; 
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, Typography, Stack, Grid, Card, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Button, CircularProgress, Chip, Accordion, 
  AccordionSummary, AccordionDetails, Alert, Radio, RadioGroup, FormControlLabel, FormControl
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

// --- COMPONENTE INTERNO DE QUIZ ---
const ModuleQuiz = ({ questions, onComplete }) => {
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });
    setSubmitted(true);
    if (onComplete) onComplete(score);
  };

  return (
    <Stack spacing={4}>
      <Typography variant="h5" fontWeight="bold">Desafio do Módulo</Typography>
      {questions.map((q, idx) => (
        <Card key={idx} variant="outlined" sx={{ p: 2, bgcolor: submitted ? (answers[idx] === q.correctAnswer ? '#e8f5e9' : '#ffebee') : 'transparent' }}>
          <Typography fontWeight="bold" sx={{ mb: 2 }}>{idx + 1}. {q.question}</Typography>
          <FormControl component="fieldset">
            <RadioGroup value={answers[idx] || ''} onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}>
              {q.options.map((opt, oIdx) => (
                <FormControlLabel key={oIdx} value={opt} control={<Radio disabled={submitted} />} label={opt} />
              ))}
            </RadioGroup>
          </FormControl>
        </Card>
      ))}
      {!submitted && <Button variant="contained" onClick={handleSubmit} size="large">Finalizar Quiz</Button>}
      {submitted && <Alert severity="info">Você acertou {Object.values(answers).filter((a, i) => a === questions[i].correctAnswer).length} de {questions.length} questões!</Alert>}
    </Stack>
  );
};

export default function CourseView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth(); 

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeLesson, setActiveLesson] = React.useState(null);
  const [activeQuiz, setActiveQuiz] = React.useState(null); // Estado para o Quiz ativo
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
          setActiveLesson(data.modules?.[0]?.lessons?.[0]);

          if (user?._id) {
            try {
              const res = await api.get(`/courses/${data._id}/progress`);
              if (res.data.success) setCompletedLessons(res.data.completedLessons || []);
            } catch (err) {
              const saved = localStorage.getItem(`progress-${data._id}`);
              if (saved) setCompletedLessons(JSON.parse(saved));
            }
          }
        }
        setLoading(false);
      } catch (err) {
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
    
    const updated = isCompleted
      ? completedLessons.filter(l => l !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(updated);
    localStorage.setItem(`progress-${course._id}`, JSON.stringify(updated));

    try {
      setSaveError(null);
      await api.post(`/courses/${course._id}/progress`, {
        lessonId: lessonId,
        completed: !isCompleted // O backend agora recebe explicitamente se é true ou false
      });
    } catch (err) {
      setSaveError("Erro ao sincronizar progresso.");
    }
  };

  if (loading || authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
  if (!course) return <Typography sx={{ p: 4 }}>Curso não encontrado.</Typography>;

  return (
    <Box sx={{ flexGrow: 1, mt: -2 }}>
      {saveError && <Alert severity="error" onClose={() => setSaveError(null)}>{saveError}</Alert>}
      
      <Grid container>
        <Grid item xs={12} md={4} lg={3}>
          <SidebarContainer>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="bold">{course.title}</Typography>
              <Chip label={course.level} size="small" color="primary" sx={{ mt: 1 }} />
            </Box>
            <Divider />

            {course.modules?.map((module, mIdx) => (
              <Accordion key={module._key || mIdx} defaultExpanded={mIdx === 0} elevation={0} square>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight="bold" variant="body2">{mIdx + 1}. {module.title}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List disablePadding>
                    {module.lessons?.map((lesson, lIdx) => {
                      const isDone = completedLessons.includes(lesson._key || lesson.title);
                      return (
                        <ListItem key={lesson._key || lIdx} disablePadding>
                          <ListItemButton 
                            selected={activeLesson?._key === lesson._key && !activeQuiz}
                            onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); }}
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
                          selected={activeQuiz === module._key}
                          sx={{ bgcolor: 'action.hover' }}
                          onClick={() => { setActiveQuiz(module._key); setActiveLesson(null); }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}><QuizIcon color="primary" fontSize="small" /></ListItemIcon>
                          <ListItemText primary="Quiz do Módulo" primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} />
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
            {activeQuiz ? (
              <ModuleQuiz 
                questions={course.modules.find(m => m._key === activeQuiz)?.exercises} 
                onComplete={(score) => console.log("Score:", score)} 
              />
            ) : activeLesson ? (
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h4" fontWeight="bold">{activeLesson.title}</Typography>
                  {user && (
                    <Button 
                      variant={completedLessons.includes(activeLesson._key || activeLesson.title) ? "outlined" : "contained"}
                      color="success"
                      onClick={() => toggleLessonComplete(activeLesson)}
                    >
                      {completedLessons.includes(activeLesson._key || activeLesson.title) ? "Concluída" : "Concluir Aula"}
                    </Button>
                  )}
                </Box>
                <Divider />
                
                {user ? (
                  <Box className="markdown-body">
                    <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
                  </Box>
                ) : (
                  <Card sx={{ bgcolor: '#f5f5f5', p: 4, textAlign: 'center', border: '1px dashed #ccc' }}>
                    <LockIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6">Conteúdo Restrito</Typography>
                    <Typography sx={{ mb: 3 }}>Faça login para acessar as aulas e marcar seu progresso.</Typography>
                    <Button variant="contained" onClick={() => navigate('/entrar')}>Entrar Agora</Button>
                  </Card>
                )}
              </Stack>
            ) : (
              <Typography variant="h5" color="text.secondary" textAlign="center" mt={10}>Selecione uma aula.</Typography>
            )}
          </ContentContainer>
        </Grid>
      </Grid>
    </Box>
  );
}