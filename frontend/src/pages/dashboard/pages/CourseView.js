import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { client } from '../../../client';
import api from '../../../services/api'; 
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, Typography, Stack, Card, Grid,
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
import ReplayIcon from '@mui/icons-material/Replay';
import VerifiedIcon from '@mui/icons-material/Verified';
import MenuBook from '@mui/icons-material/MenuBook';

const SidebarContainer = styled(Box)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  height: 'calc(100vh - 64px)', 
  overflowY: 'auto',
  backgroundColor: theme.palette.background.paper,
  position: 'sticky',
  top: 64,
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 64px)',
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.default,
}));

const shuffleArray = (array) => {
  if (!array || array.length === 0) return [];
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const ModuleQuiz = ({ rawQuestions = [], onComplete, isSaving, title = "Desafio" }) => {
  const [questions, setQuestions] = React.useState([]);
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState(0);

  const initQuiz = React.useCallback(() => {
    if (!rawQuestions) return;
    const shuffled = shuffleArray(rawQuestions).map(q => ({
      ...q,
      shuffledOptions: shuffleArray(q.options || [])
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
    if (onComplete) onComplete(currentScore, questions.length);
  };

  if (!rawQuestions || rawQuestions.length === 0) {
    return <Alert severity="info">Este módulo não possui questões.</Alert>;
  }

  const isWin = score === questions.length;

  return (
    <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" color="primary">{title}</Typography>
      
      {questions.map((q, idx) => (
        <Card key={idx} variant="outlined" sx={{ 
          p: 3, 
          transition: '0.3s',
          borderLeft: submitted ? 6 : 1,
          borderLeftColor: submitted ? (answers[idx] === q.correctAnswer ? 'success.main' : 'error.main') : 'divider',
        }}>
          <Typography fontWeight="bold" sx={{ mb: 2 }}>{idx + 1}. {q.question}</Typography>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup 
              value={answers[idx] || ''} 
              onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
            >
              {q.shuffledOptions.map((opt, oIdx) => (
                <FormControlLabel 
                  key={oIdx} 
                  value={opt} 
                  control={<Radio disabled={submitted} />} 
                  label={opt} 
                  sx={{ borderRadius: 1, mb: 1 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Card>
      ))}

      {!submitted ? (
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          size="large" 
          disabled={Object.keys(answers).length < questions.length || isSaving}
        >
          {isSaving ? "Processando..." : "Enviar Respostas"}
        </Button>
      ) : (
        <Stack spacing={2}>
          <Alert severity={isWin ? "success" : "warning"} variant="filled">
            {isWin ? "Incrível! Você dominou este assunto." : `Você acertou ${score} de ${questions.length} questões.`}
          </Alert>
          {!isWin && (
            <Button startIcon={<ReplayIcon />} variant="outlined" onClick={initQuiz} sx={{ alignSelf: 'start' }}>
              Tentar Novamente
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
  const [isSaving, setIsSaving] = React.useState(false);
  const [courseStatus, setCourseStatus] = React.useState('em_andamento');

  React.useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const query = `*[_type == "course" && slug.current == $slug][0]{
          _id, title, description, level,
          modules[]{
            _key, title,
            lessons[]{ _key, title, content, duration },
            exercises[]{ _key, question, options, correctAnswer }
          },
          finalExam[]{ _key, question, options, correctAnswer }
        }`;
        const data = await client.fetch(query, { slug });

        if (data) {
          setCourse(data);
          setActiveLesson(data.modules?.[0]?.lessons?.[0]);

          if (user?._id) {
            const res = await api.get(`/courses/${data._id}/progress`);
            if (res.data.success) {
              // Extraímos apenas os IDs das aulas para facilitar o uso dos ícones no front
              const idsOnly = res.data.completedLessons?.map(l => l.lessonKey) || [];
              setCompletedLessons(idsOnly);
              setCourseStatus(res.data.status);
            }
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
    
    // Atualização otimista do estado local
    const updated = isCompleted ? completedLessons.filter(id => id !== lessonId) : [...completedLessons, lessonId];
    setCompletedLessons(updated);

    try {
      await api.post(`/courses/${course._id}/progress`, { 
        lessonId, 
        lessonTitle: lesson.title, // Novo: Enviando título para o Sanity
        completed: !isCompleted 
      });
    } catch (err) { 
      console.error("Erro ao salvar progresso"); 
    }
  };

  const handleQuizComplete = async (score, total) => {
    if (!user) return;
    const isFinal = activeQuiz === 'final';
    
    // Encontramos o módulo atual se não for o exame final
    const currentModule = !isFinal ? course.modules.find(m => m._key === activeQuiz) : null;

    setIsSaving(true);
    try {
      const res = await api.post(`/courses/${course._id}/quiz-result`, {
        score,
        totalQuestions: total,
        isFinalExam: isFinal,
        moduleKey: currentModule?._key, // Novo
        moduleTitle: currentModule?.title // Novo
      });
      
      if (res.data.status === 'concluido') setCourseStatus('concluido');
    } catch (err) {
      console.error("Erro ao salvar resultado");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  if (!course) return <Typography sx={{ p: 4 }}>Curso não encontrado.</Typography>;

  const allLessonsCount = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0);
  const isAllLessonsDone = completedLessons.length >= allLessonsCount && allLessonsCount > 0;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container>
        {/* SIDEBAR */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <SidebarContainer>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>{course.title}</Typography>
              <Stack direction="row" spacing={1}>
                <Chip label={course.level} size="small" variant="outlined" />
                {courseStatus === 'concluido' && (
                  <Chip icon={<VerifiedIcon />} label="Certificado" color="success" size="small" />
                )}
              </Stack>
            </Box>
            <Divider />

            {course.modules?.map((module, mIdx) => {
              const moduleLessons = module.lessons || [];
              const completedInModule = moduleLessons.filter(l => completedLessons.includes(l._key)).length;

              return (
                <Accordion key={module._key} defaultExpanded={mIdx === 0} elevation={0} square>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box>
                       <Typography fontWeight="bold" variant="body2">{module.title}</Typography>
                       <Typography variant="caption" color="text.secondary">{completedInModule}/{moduleLessons.length} aulas</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List disablePadding>
                      {moduleLessons.map((lesson) => (
                        <ListItem key={lesson._key} disablePadding>
                          <ListItemButton 
                            selected={activeLesson?._key === lesson._key && !activeQuiz}
                            onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); window.scrollTo(0,0); }}
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
                            selected={activeQuiz === module._key}
                            onClick={() => { setActiveQuiz(module._key); setActiveLesson(null); }}
                            sx={{ bgcolor: 'action.hover' }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <QuizIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Quiz de Prática" primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} />
                          </ListItemButton>
                        </ListItem>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ px: 2, pb: 4 }}>
              <ListItemButton 
                disabled={!isAllLessonsDone}
                selected={activeQuiz === 'final'}
                onClick={() => { setActiveQuiz('final'); setActiveLesson(null); }}
                sx={{ 
                  borderRadius: 2, 
                  bgcolor: isAllLessonsDone ? 'primary.main' : 'transparent',
                  color: isAllLessonsDone ? 'white' : 'inherit',
                  '&.Mui-selected': { bgcolor: 'primary.dark', color: 'white' },
                  '&:hover': { bgcolor: isAllLessonsDone ? 'primary.dark' : 'action.hover' }
                }}
              >
                <ListItemIcon>
                  {courseStatus === 'concluido' ? <VerifiedIcon sx={{ color: 'white' }} /> : <LockIcon sx={{ color: isAllLessonsDone ? 'white' : 'inherit' }} />}
                </ListItemIcon>
                <ListItemText 
                  primary="EXAME FINAL" 
                  secondary={!isAllLessonsDone ? "Bloqueado" : "Disponível"}
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                  secondaryTypographyProps={{ color: isAllLessonsDone ? 'white' : 'text.secondary', fontSize: '0.7rem' }}
                />
              </ListItemButton>
            </Box>
          </SidebarContainer>
        </Grid>

        {/* CONTEÚDO PRINCIPAL */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <ContentContainer>
            {activeQuiz === 'final' ? (
              <ModuleQuiz 
                title="Exame Final de Certificação"
                rawQuestions={course.finalExam} 
                onComplete={handleQuizComplete}
                isSaving={isSaving}
              />
            ) : activeQuiz ? (
              <ModuleQuiz 
                title={course.modules.find(m => m._key === activeQuiz)?.title || "Desafio"}
                rawQuestions={course.modules.find(m => m._key === activeQuiz)?.exercises} 
                onComplete={handleQuizComplete}
                isSaving={isSaving}
              />
            ) : activeLesson ? (
              <Stack spacing={3} sx={{ maxWidth: 900, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>{activeLesson.title}</Typography>
                    <Typography variant="caption" color="text.secondary">Tempo estimado: {activeLesson.duration || '5'} min</Typography>
                  </Box>
                  {user && (
                    <Button 
                      variant={completedLessons.includes(activeLesson._key) ? "outlined" : "contained"}
                      color="success"
                      startIcon={completedLessons.includes(activeLesson._key) ? <CheckCircleIcon /> : null}
                      onClick={() => toggleLessonComplete(activeLesson)}
                    >
                      {completedLessons.includes(activeLesson._key) ? "Concluída" : "Marcar como lida"}
                    </Button>
                  )}
                </Box>
                <Divider />
                <Box 
                  sx={{ 
                    '& p': { lineHeight: 1.7, fontSize: '1.1rem', mb: 2 },
                    '& pre': { bgcolor: 'grey.900', color: 'common.white', p: 2, borderRadius: 1, overflowX: 'auto' },
                    '& code': { bgcolor: 'action.hover', p: 0.5, borderRadius: 1, fontFamily: 'monospace' },
                    '& img': { maxWidth: '100%', borderRadius: 2 }
                  }}
                >
                  <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
                </Box>
              </Stack>
            ) : (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '60vh' }}>
                   <MenuBook sx={{ fontSize: 80, opacity: 0.1, mb: 2 }} />
                   <Typography variant="h5" color="text.disabled">Selecione uma aula para começar</Typography>
                </Stack>
            )}
          </ContentContainer>
        </Grid>
      </Grid>
    </Box>
  );
}