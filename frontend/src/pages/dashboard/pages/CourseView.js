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

// --- ESTILOS CUSTOMIZADOS ---
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

// --- COMPONENTE DE QUIZ INTERATIVO ---
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
      setSubmitted(false);
      setAnswers({});
    }
  }, [rawQuestions, storageKey]);

  React.useEffect(() => { initQuiz(); }, [initQuiz]);

  const handleSubmit = () => {
    if (isGuest) return; 

    let currentScore = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) currentScore++;
    });
    setScore(currentScore);
    setSubmitted(true);
    localStorage.setItem(storageKey, JSON.stringify({ 
        questions, 
        answers, 
        submitted: true, 
        score: currentScore 
    }));
    if (onComplete) onComplete(currentScore, questions.length);
  };

  const handleReset = () => {
    localStorage.removeItem(storageKey);
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
          {isSaving ? "Gravando XP..." : isGuest ? "Faça Login para Responder" : "Finalizar Quiz"}
        </Button>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: isWin ? 'success.dark' : 'grey.900', color: 'white' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {isWin ? "🎯 Excelente! Domínio total!" : `Você acertou ${score} de ${questions.length}`}
          </Typography>
          {!isWin && (
            <Button variant="contained" color="inherit" onClick={handleReset} sx={{ color: 'black', mt: 2 }} startIcon={<ReplayIcon />}>
              Tentar Novamente (Reiniciar)
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
        console.error("Erro ao carregar curso:", err);
        setLoading(false);
      }
    };

    if (!authLoading) fetchCourseData();
  }, [slug, authLoading, signed, getCourseProgress]);

  const toggleLessonComplete = async (lesson) => {
    if (!signed) return navigate('/entrar', { state: { from: window.location.pathname } });
    
    const lessonId = lesson._key;
    const isCurrentlyCompleted = completedLessons.includes(lessonId);
    
    // UI Feedback imediato
    setCompletedLessons(prev => isCurrentlyCompleted ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);

    try {
      await updateLessonProgress(course._id, { 
        lessonId, 
        lessonTitle: lesson.title,
        completed: !isCurrentlyCompleted 
      });
      fetchGlobalData(true); 
    } catch (err) { 
      console.error("Erro ao sincronizar progresso"); 
    }
  };

  const handleQuizComplete = async (score, total) => {
    if (!signed) return;

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
        setCompletedQuizzes(prev => [...new Set([...prev, currentModule._key])]);
      }

      if (res.data.status === 'concluido') setCourseStatus('concluido');
      fetchGlobalData(true);
    } catch (err) {
      console.error("Erro ao salvar resultado do quiz");
    } finally {
      setIsSaving(false);
    }
  };

  const MarkdownComponents = {
    h2: ({node, ...props}) => <Typography variant="h5" fontWeight="bold" sx={{ mt: 4, mb: 2, color: 'primary.main' }} {...props} />,
    h3: ({node, ...props}) => <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }} {...props} />,
    p: ({node, ...props}) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.secondary' }} {...props} />,
    li: ({node, ...props}) => <Typography component="li" variant="body1" sx={{ mb: 1, color: 'text.secondary' }} {...props} />,
    code: ({node, inline, ...props}) => (
      inline ? 
      <Box component="code" sx={{ bgcolor: 'action.hover', p: '2px 4px', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.9em' }} {...props} /> :
      <Box component="pre" sx={{ bgcolor: 'grey.900', color: '#fff', p: 3, borderRadius: 2, overflowX: 'auto', my: 3, fontSize: '0.85em' }}>
        <code {...props} />
      </Box>
    )
  };

  if (loading || authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  if (!course) return <Box sx={{ p: 4 }}><Alert severity="error">Curso não encontrado.</Alert></Box>;

  // --- LÓGICA DE BLOQUEIO ---
  const allLessonsCount = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0);
  const totalModulesWithQuiz = course.modules?.filter(m => m.exercises?.length > 0).length || 0;
  
  const isAllLessonsDone = completedLessons.length >= allLessonsCount;
  const isAllQuizzesDone = completedQuizzes.length >= totalModulesWithQuiz;
  const isFinalExamUnlocked = signed && isAllLessonsDone && isAllQuizzesDone;

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default' }}>
      <Grid container>
        {/* SIDEBAR DE NAVEGAÇÃO */}
        <Grid item xs={12} md={3}>
          <SidebarContainer>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="900">{course.title}</Typography>
              <Stack direction="row" spacing={1} mt={1}>
                <Chip label={course.level} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                {courseStatus === 'concluido' && <Chip icon={<VerifiedIcon />} label="Certificado" color="success" size="small" />}
              </Stack>
            </Box>
            <Divider />

            {course.modules?.map((module) => {
              const moduleLessonKeys = module.lessons?.map(l => l._key) || [];
              const completedInThisModule = moduleLessonKeys.filter(k => completedLessons.includes(k)).length;
              const isModuleLessonsDone = completedInThisModule === moduleLessonKeys.length;

              return (
                <Accordion key={module._key} defaultExpanded elevation={0} square sx={{ '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box>
                      <Typography fontWeight="bold" variant="body2">{module.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {completedInThisModule}/{module.lessons?.length} aulas concluídas
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List disablePadding>
                      {module.lessons?.map((lesson) => (
                        <ListItem key={lesson._key} disablePadding>
                          <ListItemButton 
                            selected={activeLesson?._key === lesson._key}
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
                        <ListItemButton 
                          disabled={signed && !isModuleLessonsDone}
                          selected={activeQuiz === module._key}
                          onClick={() => { setActiveQuiz(module._key); setActiveLesson(null); window.scrollTo(0,0); }}
                          sx={{ bgcolor: 'action.hover' }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {completedQuizzes.includes(module._key) ? 
                              <CheckCircleIcon color="primary" fontSize="small" /> : 
                              (signed && !isModuleLessonsDone ? <LockIcon fontSize="small" /> : <QuizIcon color="primary" fontSize="small" />)}
                          </ListItemIcon>
                          <ListItemText 
                            primary="Quiz do Módulo" 
                            primaryTypographyProps={{ 
                              variant: 'body2', 
                              fontWeight: 'bold',
                              color: (signed && !isModuleLessonsDone) ? 'text.disabled' : 'primary.main'
                            }} 
                          />
                        </ListItemButton>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            <Box sx={{ p: 3 }}>
              <Button 
                fullWidth 
                variant={isFinalExamUnlocked ? "contained" : "outlined"}
                disabled={!isFinalExamUnlocked}
                startIcon={courseStatus === 'concluido' ? <VerifiedIcon /> : (isFinalExamUnlocked ? <QuizIcon /> : <LockIcon />)}
                onClick={() => { setActiveQuiz('final'); setActiveLesson(null); window.scrollTo(0,0); }}
              >
                Exame Final
              </Button>
              {!isFinalExamUnlocked && signed && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  Complete tudo para liberar o exame.
                </Typography>
              )}
            </Box>
          </SidebarContainer>
        </Grid>

        {/* ÁREA DE CONTEÚDO PRINCIPAL */}
        <Grid item xs={12} md={9}>
          <ContentContainer>
            {activeQuiz ? (
              <ModuleQuiz 
                courseId={course._id}
                quizKey={activeQuiz}
                title={activeQuiz === 'final' ? "Exame Final de Certificação" : "Desafio de Módulo"}
                rawQuestions={activeQuiz === 'final' ? course.finalExam : course.modules.find(m => m._key === activeQuiz)?.exercises}
                onComplete={handleQuizComplete}
                isSaving={isSaving}
                isGuest={!signed}
              />
            ) : activeLesson ? (
              <Stack spacing={4} sx={{ maxWidth: 900, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="overline" color="primary" fontWeight="bold">Lendo agora</Typography>
                    <Typography variant="h3" fontWeight="900">{activeLesson.title}</Typography>
                  </Box>
                  <Button 
                    variant={completedLessons.includes(activeLesson._key) ? "outlined" : "contained"}
                    color="success"
                    size="large"
                    onClick={() => toggleLessonComplete(activeLesson)}
                    startIcon={completedLessons.includes(activeLesson._key) ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                    sx={{ borderRadius: 3 }}
                  >
                    {completedLessons.includes(activeLesson._key) ? "Aula Concluída" : "Marcar como Lida"}
                  </Button>
                </Box>
                <Divider />
                <Box sx={{ pb: 10 }}>
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