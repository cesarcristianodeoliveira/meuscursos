import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { client } from '../../../client';
import api from '../../../services/api'; 
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, Typography, Stack, Card, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Button, CircularProgress, Chip, Accordion, 
  AccordionSummary, AccordionDetails, Alert, Radio, RadioGroup, FormControlLabel, FormControl
} from '@mui/material';
import Grid from '@mui/material/Grid2'; // Usando o novo Grid v2/v6
import { styled } from '@mui/material/styles';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import QuizIcon from '@mui/icons-material/Quiz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import ReplayIcon from '@mui/icons-material/Replay';

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

// --- ALGORITMO DE EMBARALHAMENTO (Fisher-Yates) ---
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// --- COMPONENTE DE QUIZ EVOLUÍDO ---
const ModuleQuiz = ({ rawQuestions, onComplete }) => {
  const [questions, setQuestions] = React.useState([]);
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState(0);

  // Embaralha ao carregar ou ao clicar em refazer
  const initQuiz = React.useCallback(() => {
    const shuffled = shuffleArray(rawQuestions).map(q => ({
      ...q,
      shuffledOptions: shuffleArray(q.options)
    }));
    setQuestions(shuffled);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  }, [rawQuestions]);

  React.useEffect(() => { initQuiz(); }, [initQuiz]);

  const handleSubmit = () => {
    let currentScore = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) currentScore++;
    });
    setScore(currentScore);
    setSubmitted(true);
    if (onComplete) onComplete(currentScore);
  };

  const isWin = score === questions.length;

  return (
    <Stack spacing={4}>
      <Typography variant="h5" fontWeight="bold">Desafio do Módulo</Typography>
      
      {questions.map((q, idx) => (
        <Card key={idx} variant="outlined" sx={{ 
          p: 2, 
          bgcolor: submitted ? (answers[idx] === q.correctAnswer ? 'success.light' : 'error.light') : 'transparent',
          opacity: submitted && !isWin ? 0.8 : 1
        }}>
          <Typography fontWeight="bold" sx={{ mb: 2 }}>{idx + 1}. {q.question}</Typography>
          <FormControl component="fieldset">
            <RadioGroup 
              value={answers[idx] || ''} 
              onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
            >
              {q.shuffledOptions.map((opt, oIdx) => (
                <FormControlLabel key={oIdx} value={opt} control={<Radio disabled={submitted} />} label={opt} />
              ))}
            </RadioGroup>
          </FormControl>
        </Card>
      ))}

      {!submitted ? (
        <Button variant="contained" onClick={handleSubmit} size="large" disabled={Object.keys(answers).length < questions.length}>
          Finalizar e Corrigir
        </Button>
      ) : (
        <Stack spacing={2}>
          <Alert severity={isWin ? "success" : "warning"}>
            {isWin ? "Incrível! Você dominou este módulo." : `Você acertou ${score} de ${questions.length}. Tente novamente para atingir 100%!`}
          </Alert>
          {!isWin && (
            <Button startIcon={<ReplayIcon />} variant="outlined" onClick={initQuiz}>
              Refazer e Embaralhar Questões
            </Button>
          )}
        </Stack>
      )}
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
  const [activeQuiz, setActiveQuiz] = React.useState(null);
  const [completedLessons, setCompletedLessons] = React.useState([]);

  React.useEffect(() => {
    const fetchCourseData = async () => {
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
            const res = await api.get(`/courses/${data._id}/progress`);
            if (res.data.success) setCompletedLessons(res.data.completedLessons || []);
          }
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    if (!authLoading) fetchCourseData();
  }, [slug, authLoading, user?._id]);

  const toggleLessonComplete = async (lesson) => {
    if (!user) return navigate('/entrar');
    
    const lessonId = lesson._key;
    const isCompleted = completedLessons.includes(lessonId);
    const updated = isCompleted ? completedLessons.filter(l => l !== lessonId) : [...completedLessons, lessonId];

    setCompletedLessons(updated);
    try {
      await api.post(`/courses/${course._id}/progress`, { lessonId, completed: !isCompleted });
    } catch (err) { console.error("Erro ao salvar progresso"); }
  };

  if (loading || authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
  if (!course) return <Typography sx={{ p: 4 }}>Curso não encontrado.</Typography>;

  return (
    <Box sx={{ flexGrow: 1, mt: -2 }}>
      <Grid container>
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <SidebarContainer>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="bold">{course.title}</Typography>
              <Chip label={course.level} size="small" color="primary" sx={{ mt: 1 }} />
            </Box>
            <Divider />

            {course.modules?.map((module, mIdx) => {
              const allLessonsInModule = module.lessons?.map(l => l._key) || [];
              const isModuleComplete = allLessonsInModule.every(id => completedLessons.includes(id));

              return (
                <Accordion key={module._key || mIdx} defaultExpanded={mIdx === 0} elevation={0} square>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold" variant="body2">{mIdx + 1}. {module.title}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List disablePadding>
                      {module.lessons?.map((lesson) => (
                        <ListItem key={lesson._key} disablePadding>
                          <ListItemButton 
                            selected={activeLesson?._key === lesson._key && !activeQuiz}
                            onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {completedLessons.includes(lesson._key) ? <CheckCircleIcon color="success" fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                            </ListItemIcon>
                            <ListItemText primary={lesson.title} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                      
                      {module.exercises?.length > 0 && (
                        <ListItem disablePadding>
                          <ListItemButton 
                            disabled={!isModuleComplete && !!user} // Bloqueia se não completou aulas
                            selected={activeQuiz === module._key}
                            onClick={() => { setActiveQuiz(module._key); setActiveLesson(null); }}
                            sx={{ bgcolor: isModuleComplete ? 'action.hover' : 'transparent' }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {isModuleComplete ? <QuizIcon color="primary" fontSize="small" /> : <LockIcon fontSize="small" />}
                            </ListItemIcon>
                            <ListItemText 
                              primary="Quiz do Módulo" 
                              secondary={!isModuleComplete && user ? "Conclua as aulas para liberar" : ""}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} 
                            />
                          </ListItemButton>
                        </ListItem>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </SidebarContainer>
        </Grid>

        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <ContentContainer>
            {activeQuiz ? (
              <ModuleQuiz 
                rawQuestions={course.modules.find(m => m._key === activeQuiz)?.exercises} 
                onComplete={(score) => console.log("Quiz finalizado. Acertos:", score)} 
              />
            ) : activeLesson ? (
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h4" fontWeight="bold">{activeLesson.title}</Typography>
                  {user && (
                    <Button 
                      variant={completedLessons.includes(activeLesson._key) ? "outlined" : "contained"}
                      color="success"
                      onClick={() => toggleLessonComplete(activeLesson)}
                    >
                      {completedLessons.includes(activeLesson._key) ? "Concluída" : "Concluir Aula"}
                    </Button>
                  )}
                </Box>
                <Divider />
                {user ? (
                  <Box className="markdown-body"><ReactMarkdown>{activeLesson.content}</ReactMarkdown></Box>
                ) : (
                  <Card sx={{ p: 4, textAlign: 'center', border: '1px dashed #ccc' }}>
                    <LockIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6">Conteúdo Restrito</Typography>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/entrar')}>Entrar para Estudar</Button>
                  </Card>
                )}
              </Stack>
            ) : null}
          </ContentContainer>
        </Grid>
      </Grid>
    </Box>
  );
}