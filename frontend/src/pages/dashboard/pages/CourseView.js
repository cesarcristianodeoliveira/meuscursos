import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { client } from '../../../client';
import api from '../../../services/api'; 
import { useAuth } from '../../../contexts/AuthContext';
import { useCourse } from '../../../contexts/CourseContext';
import { 
  Box, Typography, Stack, Card, Grid,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Button, CircularProgress, Chip, Accordion, 
  AccordionSummary, AccordionDetails, Alert, Radio, RadioGroup, 
  FormControlLabel, Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Ícones
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import QuizIcon from '@mui/icons-material/Quiz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import ReplayIcon from '@mui/icons-material/Replay';
import VerifiedIcon from '@mui/icons-material/Verified';

// --- ESTILOS ---
const SidebarContainer = styled(Box)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  height: 'calc(100vh - 64px)', 
  overflowY: 'auto',
  backgroundColor: theme.palette.background.paper,
  position: 'sticky',
  top: 64,
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.divider, borderRadius: '10px' }
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 64px)',
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.default,
}));

const shuffleArray = (array) => {
  if (!array || array.length === 0) return [];
  return [...array].sort(() => Math.random() - 0.5);
};

// --- COMPONENTE DE QUIZ ---
const ModuleQuiz = ({ courseId, quizKey, rawQuestions = [], onComplete, isSaving, title, isGuest }) => {
  const [questions, setQuestions] = React.useState([]);
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState(0);
  
  const storageKey = `quiz_v2_${courseId}_${quizKey}`;

  const initQuiz = React.useCallback(() => {
    if (!rawQuestions || rawQuestions.length === 0) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setQuestions(parsed.questions || []);
      setAnswers(parsed.answers || {});
      setSubmitted(parsed.submitted || false);
      setScore(parsed.score || 0);
    } else {
      const shuffled = rawQuestions.map(q => ({
        ...q,
        shuffledOptions: shuffleArray(q.options || [])
      }));
      setQuestions(shuffled);
    }
  }, [rawQuestions, storageKey]);

  React.useEffect(() => { initQuiz(); }, [initQuiz]);

  const handleSubmit = () => {
    if (isGuest) return onComplete(0, 0); // Redireciona se for convidado

    let currentScore = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) currentScore++;
    });
    setScore(currentScore);
    setSubmitted(true);
    localStorage.setItem(storageKey, JSON.stringify({ questions, answers, submitted: true, score: currentScore }));
    if (onComplete) onComplete(currentScore, questions.length);
  };

  const handleReset = () => {
    localStorage.removeItem(storageKey);
    setAnswers({});
    setSubmitted(false);
    initQuiz();
  };

  if (!rawQuestions || rawQuestions.length === 0) return <Alert severity="info">Nenhuma questão disponível para este módulo.</Alert>;

  const isWin = score === questions.length;

  return (
    <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" fontWeight="900" color="primary">{title}</Typography>
      
      {questions.map((q, idx) => (
        <Card key={idx} variant="outlined" sx={{ 
          p: 3, borderRadius: 3,
          borderLeft: 8,
          borderLeftColor: !submitted ? 'divider' : (answers[idx] === q.correctAnswer ? 'success.main' : 'error.main'),
        }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{idx + 1}. {q.question}</Typography>
          <RadioGroup 
            value={answers[idx] || ''} 
            onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
          >
            {q.shuffledOptions?.map((opt, oIdx) => (
              <FormControlLabel 
                key={oIdx} 
                value={opt} 
                control={<Radio disabled={submitted} />} 
                label={opt} 
                sx={{ 
                  mb: 1, p: 1, borderRadius: 2,
                  bgcolor: submitted && opt === q.correctAnswer ? 'success.light' : 'transparent',
                  '&:hover': { bgcolor: !submitted ? 'action.hover' : 'none' }
                }}
              />
            ))}
          </RadioGroup>
        </Card>
      ))}

      {!submitted ? (
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          size="large" 
          disabled={(!isGuest && Object.keys(answers).length < questions.length) || isSaving}
        >
          {isSaving ? "Finalizando..." : isGuest ? "Fazer Login para Responder" : "Enviar Respostas"}
        </Button>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: isWin ? 'success.dark' : 'grey.800', color: 'white' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {isWin ? "🎯 Perfeito! Você passou!" : `Resultado: ${score} de ${questions.length}`}
          </Typography>
          {!isWin && (
            <Button variant="contained" color="inherit" onClick={handleReset} sx={{ color: 'black', mt: 2 }} startIcon={<ReplayIcon />}>
              Tentar Novamente
            </Button>
          )}
        </Paper>
      )}
    </Stack>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function CourseView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { signed, authLoading } = useAuth(); 
  const { fetchGlobalData, getCourseProgress, updateLessonProgress } = useCourse();

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeLesson, setActiveLesson] = React.useState(null);
  const [activeQuiz, setActiveQuiz] = React.useState(null);
  const [completedLessons, setCompletedLessons] = React.useState([]);
  const [completedQuizzes, setCompletedQuizzes] = React.useState([]); 
  const [isSaving, setIsSaving] = React.useState(false);
  const [courseStatus, setCourseStatus] = React.useState('em_andamento');

  // 1. Carrega o curso e o progresso
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

          if (signed) {
            const prog = await getCourseProgress(data._id);
            setCompletedLessons(prog.completedLessons?.map(l => l.lessonKey) || []);
            setCompletedQuizzes(prog.completedQuizzes?.filter(q => q.isPassed).map(q => q.moduleKey) || []);
            setCourseStatus(prog.status);
          }
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    if (!authLoading) fetchCourseData();
  }, [slug, authLoading, signed, getCourseProgress]);

  // 2. Ação de Concluir Aula
  const toggleLessonComplete = async (lesson) => {
    if (!signed) return navigate('/entrar', { state: { from: window.location.pathname } });
    
    const lessonId = lesson._key;
    const isCurrentlyCompleted = completedLessons.includes(lessonId);
    
    // UI Otimista
    setCompletedLessons(prev => isCurrentlyCompleted ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);

    try {
      await updateLessonProgress(course._id, { 
        lessonId, 
        lessonTitle: lesson.title,
        completed: !isCurrentlyCompleted 
      });
      fetchGlobalData(true); 
    } catch (err) { 
      console.error("Erro ao salvar progresso"); 
    }
  };

  // 3. Ação de Concluir Quiz
  const handleQuizComplete = async (score, total) => {
    if (!signed) return navigate('/entrar', { state: { from: window.location.pathname } });

    const isFinal = activeQuiz === 'final';
    const currentModule = !isFinal ? course.modules.find(m => m._key === activeQuiz) : null;
    const isPassed = score === total;

    setIsSaving(true);
    try {
      const res = await api.post(`/courses/${course._id}/quiz-result`, {
        score,
        totalQuestions: total,
        isFinalExam: isFinal,
        isPassed: isPassed,
        moduleKey: currentModule?._key,
        moduleTitle: currentModule?.title
      });
      
      if (isPassed && !isFinal) {
        setCompletedQuizzes(prev => [...prev, currentModule._key]);
      }

      if (res.data.status === 'concluido') setCourseStatus('concluido');
      fetchGlobalData(true);
    } catch (err) {
      console.error("Erro ao salvar resultado");
    } finally {
      setIsSaving(false);
    }
  };

  const MarkdownComponents = {
    h2: ({node, ...props}) => <Typography variant="h5" fontWeight="bold" sx={{ mt: 4, mb: 2, color: 'primary.main' }} {...props} />,
    p: ({node, ...props}) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }} {...props} />,
    code: ({node, inline, ...props}) => (
      inline ? 
      <Box component="code" sx={{ bgcolor: 'action.hover', p: '2px 4px', borderRadius: 1, fontFamily: 'monospace' }} {...props} /> :
      <Box component="pre" sx={{ bgcolor: 'grey.900', color: '#fff', p: 2, borderRadius: 2, overflowX: 'auto', my: 2 }}>
        <code {...props} />
      </Box>
    )
  };

  if (loading || authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  if (!course) return <Box sx={{ p: 4 }}><Alert severity="error">Curso não encontrado.</Alert></Box>;

  // --- LÓGICA DE TRAVAS ---
  const allLessonsCount = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0);
  const isAllLessonsDone = completedLessons.length >= allLessonsCount;
  const isFinalExamUnlocked = signed && isAllLessonsDone && (completedQuizzes.length >= (course.modules?.length || 0));

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default' }}>
      <Grid container>
        {/* SIDEBAR */}
        <Grid item xs={12} md={3}>
          <SidebarContainer>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="900">{course.title}</Typography>
              <Stack direction="row" spacing={1} mt={1}>
                <Chip label={course.level} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                {courseStatus === 'concluido' && <Chip icon={<VerifiedIcon />} label="Concluído" color="success" size="small" />}
              </Stack>
              {!signed && (
                <Alert severity="info" sx={{ mt: 2, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                  Faça login para salvar seu progresso.
                </Alert>
              )}
            </Box>
            <Divider />

            {course.modules?.map((module, mIdx) => {
              // Visitantes veem tudo liberado para ler, mas usuários logados seguem a trilha
              const isModuleLocked = signed && mIdx > 0 && !completedQuizzes.includes(course.modules[mIdx-1]._key);

              return (
                <Accordion 
                  key={module._key} 
                  disabled={isModuleLocked}
                  defaultExpanded={mIdx === 0} 
                  elevation={0} 
                  square 
                  sx={{ '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={isModuleLocked ? <LockIcon fontSize="small"/> : <ExpandMoreIcon />}>
                    <Box>
                      <Typography fontWeight="bold" variant="body2" color={isModuleLocked ? 'text.disabled' : 'text.primary'}>
                        {module.title}
                      </Typography>
                      {signed && (
                        <Typography variant="caption" color="text.secondary">
                          {module.lessons?.filter(l => completedLessons.includes(l._key)).length}/{module.lessons?.length} aulas
                        </Typography>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List disablePadding>
                      {module.lessons?.map((lesson, lIdx) => {
                        const isLessonLocked = signed && lIdx > 0 && !completedLessons.includes(module.lessons[lIdx-1]._key);

                        return (
                          <ListItem key={lesson._key} disablePadding>
                            <ListItemButton 
                              disabled={isLessonLocked}
                              selected={activeLesson?._key === lesson._key}
                              onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); window.scrollTo(0,0); }}
                            >
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                {completedLessons.includes(lesson._key) ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                              </ListItemIcon>
                              <ListItemText primary={lesson.title} primaryTypographyProps={{ variant: 'body2' }} />
                              {isLessonLocked && <LockIcon sx={{ fontSize: 14, ml: 1, opacity: 0.5 }} />}
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                      
                      {module.exercises?.length > 0 && (
                        <ListItemButton 
                          // Bloqueia o quiz se não terminou as aulas (apenas para logados)
                          disabled={signed && module.lessons?.some(l => !completedLessons.includes(l._key))}
                          selected={activeQuiz === module._key}
                          onClick={() => { setActiveQuiz(module._key); setActiveLesson(null); }}
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {completedQuizzes.includes(module._key) ? <CheckCircleIcon color="primary" fontSize="small" /> : <QuizIcon color="primary" fontSize="small" />}
                          </ListItemIcon>
                          <ListItemText primary="Quiz do Módulo" primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} />
                          {!signed && <LockIcon sx={{ fontSize: 14, opacity: 0.5 }} />}
                        </ListItemButton>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            <Box sx={{ p: 2 }}>
              <Button 
                fullWidth 
                variant={isFinalExamUnlocked ? "contained" : "outlined"}
                disabled={!isFinalExamUnlocked}
                startIcon={courseStatus === 'concluido' ? <VerifiedIcon /> : <LockIcon />}
                onClick={() => { setActiveQuiz('final'); setActiveLesson(null); }}
              >
                Exame Final
              </Button>
              {!isFinalExamUnlocked && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  {signed ? "Conclua todos os módulos e quizzes." : "Faça login para o Exame Final."}
                </Typography>
              )}
            </Box>
          </SidebarContainer>
        </Grid>

        {/* CONTEÚDO PRINCIPAL */}
        <Grid item xs={12} md={9}>
          <ContentContainer>
            {activeQuiz ? (
              <ModuleQuiz 
                courseId={course._id}
                quizKey={activeQuiz}
                title={activeQuiz === 'final' ? "Exame Final de Certificação" : "Desafio de Conhecimento"}
                rawQuestions={activeQuiz === 'final' ? course.finalExam : course.modules.find(m => m._key === activeQuiz)?.exercises}
                onComplete={handleQuizComplete}
                isSaving={isSaving}
                isGuest={!signed}
              />
            ) : activeLesson ? (
              <Stack spacing={4} sx={{ maxWidth: 850, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h3" fontWeight="900">{activeLesson.title}</Typography>
                  <Button 
                    variant={completedLessons.includes(activeLesson._key) ? "outlined" : "contained"}
                    color="success"
                    onClick={() => toggleLessonComplete(activeLesson)}
                    startIcon={completedLessons.includes(activeLesson._key) && <CheckCircleIcon />}
                  >
                    {completedLessons.includes(activeLesson._key) ? "Concluído" : "Concluir Aula"}
                  </Button>
                </Box>
                <Divider />
                <Box className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {activeLesson.content}
                  </ReactMarkdown>
                </Box>
              </Stack>
            ) : null}
          </ContentContainer>
        </Grid>
      </Grid>
    </Box>
  );
}