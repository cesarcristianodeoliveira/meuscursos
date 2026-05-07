import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { client } from '../../../client';
import { useAuth } from '../../../contexts/AuthContext';
import { useCourse } from '../../../contexts/CourseContext';
import {
  Box, Typography, Stack, Card, Grid,
  List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Button, CircularProgress, Chip, Accordion,
  AccordionSummary, AccordionDetails, Alert, Radio, RadioGroup,
  FormControlLabel, Paper, IconButton, Drawer, useMediaQuery, useTheme
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

// Ícones
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import QuizIcon from '@mui/icons-material/Quiz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedIcon from '@mui/icons-material/Verified';
import MenuIcon from '@mui/icons-material/Menu';

// --- ESTILOS CUSTOMIZADOS ---
const SidebarWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  overflowY: 'auto',
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  '&::-webkit-scrollbar': { width: '5px' },
  '&::-webkit-scrollbar-thumb': { 
    backgroundColor: theme.palette.divider, 
    borderRadius: '10px' 
  }
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 64px)',
  padding: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(6),
  },
  backgroundColor: theme.palette.background.default,
}));

const StyledCardQuiz = styled(Card)(({ theme, status }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  transition: 'transform 0.2s',
  borderLeft: `6px solid ${
    status === 'correct' ? theme.palette.success.main : 
    status === 'wrong' ? theme.palette.error.main : theme.palette.divider
  }`,
}));

const shuffleArray = (array) => [...(array || [])].sort(() => Math.random() - 0.5);

// --- COMPONENTE DE QUIZ ---
const ModuleQuiz = ({ courseId, quizKey, rawQuestions = [], onComplete, isSaving, title, isGuest }) => {
  const [questions, setQuestions] = React.useState([]);
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState(0);

  const storageKey = `quiz_v3_${courseId}_${quizKey}`;

  const initQuiz = React.useCallback(() => {
    if (!rawQuestions?.length) return;
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
        shuffledOptions: shuffleArray(q.options)
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
    localStorage.setItem(storageKey, JSON.stringify({ questions, answers, submitted: true, score: currentScore }));
    if (onComplete) onComplete(currentScore, questions.length);
  };

  const isWin = score === questions.length;

  return (
    <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
      <Box>
        <Typography variant="h4" fontWeight="900" gutterBottom color="primary">
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Responda todas as perguntas corretamente para validar o módulo.
        </Typography>
      </Box>

      {questions.map((q, idx) => {
        const status = !submitted ? 'idle' : (answers[idx] === q.correctAnswer ? 'correct' : 'wrong');
        return (
          <StyledCardQuiz key={idx} variant="outlined" status={status}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              {idx + 1}. {q.question}
            </Typography>
            <RadioGroup 
              value={answers[idx] || ''} 
              onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
            >
              {q.shuffledOptions?.map((opt, oIdx) => (
                <FormControlLabel
                  key={oIdx}
                  value={opt}
                  control={<Radio disabled={submitted} />}
                  label={opt}
                  sx={{ 
                    mb: 1, p: 1, borderRadius: 2, 
                    transition: '0.2s',
                    bgcolor: submitted && opt === q.correctAnswer ? alpha('#4caf50', 0.1) : 'transparent',
                    '&:hover': { bgcolor: !submitted ? alpha('#000', 0.04) : 'transparent' }
                  }}
                />
              ))}
            </RadioGroup>
          </StyledCardQuiz>
        );
      })}

      {!submitted ? (
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          size="large" 
          disabled={(!isGuest && Object.keys(answers).length < questions.length) || isSaving} 
          sx={{ borderRadius: 3, py: 2, fontWeight: 'bold', fontSize: '1.1rem' }}
        >
          {isSaving ? "Sincronizando..." : isGuest ? "Entre para responder" : "Finalizar Desafio"}
        </Button>
      ) : (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px solid', borderColor: isWin ? 'success.main' : 'divider', bgcolor: isWin ? alpha('#4caf50', 0.05) : 'background.paper' }}>
          <Typography variant="h5" fontWeight="900" color={isWin ? "success.main" : "text.primary"}>
            {isWin ? "🎯 Excelente! Você dominou este conteúdo." : `Você acertou ${score} de ${questions.length}`}
          </Typography>
          {!isWin && (
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ mt: 3, borderRadius: 2 }} 
              onClick={() => { localStorage.removeItem(storageKey); initQuiz(); }}
            >
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { signed, authLoading } = useAuth();
  const { getCourseProgress, updateLessonProgress, saveQuizResult } = useCourse();

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeLesson, setActiveLesson] = React.useState(null);
  const [activeQuiz, setActiveQuiz] = React.useState(null);
  const [completedLessons, setCompletedLessons] = React.useState([]);
  const [courseStatus, setCourseStatus] = React.useState('em_andamento');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const fetchCourse = async () => {
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
            setCourseStatus(prog.status);
          }
        }
        setLoading(false);
      } catch (err) { console.error(err); setLoading(false); }
    };
    if (!authLoading) fetchCourse();
  }, [slug, authLoading, signed, getCourseProgress]);

  const handleLessonToggle = async (lesson) => {
    if (!signed) return navigate('/entrar');
    const lessonId = lesson._key;
    const isDone = completedLessons.includes(lessonId);
    setCompletedLessons(prev => isDone ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
    await updateLessonProgress(course._id, { lessonId, lessonTitle: lesson.title, completed: !isDone });
  };

  const handleQuizComplete = async (score, total) => {
    if (!signed) return;
    setIsSaving(true);
    const isFinal = activeQuiz === 'final';
    const res = await saveQuizResult(course._id, {
      score, totalQuestions: total, isFinalExam: isFinal,
      isPassed: score === total, moduleKey: isFinal ? null : activeQuiz
    });
    if (res.status === 'concluido') setCourseStatus('concluido');
    setIsSaving(false);
  };

  const MarkdownComponents = {
    h2: (p) => <Typography variant="h5" fontWeight="900" sx={{ mt: 5, mb: 2, color: 'primary.main' }} {...p} />,
    h3: (p) => <Typography variant="h6" fontWeight="bold" sx={{ mt: 4, mb: 1.5 }} {...p} />,
    p: (p) => <Typography variant="body1" sx={{ mb: 2.5, lineHeight: 1.8, color: 'text.secondary', fontSize: '1.05rem' }} {...p} />,
    li: (p) => <Typography component="li" sx={{ mb: 1.2, color: 'text.secondary', ml: 2 }} {...p} />,
    code: ({ inline, ...p }) => inline ? 
      <Box component="code" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), px: 0.8, borderRadius: 1, color: 'secondary.dark', fontFamily: 'monospace' }} {...p} /> :
      <Box component="pre" sx={{ bgcolor: '#1e1e1e', color: '#d4d4d4', p: 3, borderRadius: 3, overflowX: 'auto', my: 4, boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}><code {...p} /></Box>
  };

  if (loading || authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}><CircularProgress size={60} thickness={4} /></Box>;
  if (!course) return <Alert severity="error">Curso não encontrado.</Alert>;

  const sidebarContent = (
    <SidebarWrapper>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="900" sx={{ lineHeight: 1.2 }}>{course.title}</Typography>
        <Stack direction="row" spacing={1} mt={2}>
          <Chip label={course.level} size="small" variant="outlined" sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }} />
          {courseStatus === 'concluido' && <Chip icon={<VerifiedIcon />} label="Concluído" color="success" size="small" />}
        </Stack>
      </Box>
      <Divider sx={{ mb: 1 }} />
      {course.modules?.map((module) => {
        const doneInModule = module.lessons?.filter(l => completedLessons.includes(l._key)).length;
        const isModuleLessonsDone = doneInModule === module.lessons?.length;

        return (
          <Accordion key={module._key} elevation={0} square defaultExpanded sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box>
                <Typography variant="subtitle2" fontWeight="800" sx={{ color: 'text.primary' }}>{module.title}</Typography>
                <Typography variant="caption" color="text.secondary">{doneInModule}/{module.lessons?.length} concluídas</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List disablePadding>
                {module.lessons?.map((lesson) => (
                  <ListItemButton
                    key={lesson._key}
                    selected={activeLesson?._key === lesson._key}
                    onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); if(isMobile) setMobileOpen(false); window.scrollTo(0,0); }}
                    sx={{ py: 1, pl: 3 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {completedLessons.includes(lesson._key) ? <CheckCircleIcon color="success" fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" color="disabled" />}
                    </ListItemIcon>
                    <ListItemText primary={lesson.title} primaryTypographyProps={{ variant: 'body2', fontWeight: activeLesson?._key === lesson._key ? 700 : 400 }} />
                  </ListItemButton>
                ))}
                {module.exercises?.length > 0 && (
                  <ListItemButton
                    disabled={!isModuleLessonsDone}
                    selected={activeQuiz === module._key}
                    onClick={() => { setActiveQuiz(module._key); setActiveLesson(null); if(isMobile) setMobileOpen(false); window.scrollTo(0,0); }}
                    sx={{ 
                      m: 1, borderRadius: 2,
                      bgcolor: activeQuiz === module._key ? 'primary.main' : alpha(theme.palette.primary.main, 0.08),
                      color: activeQuiz === module._key ? 'white' : 'primary.main',
                      '&:hover': { bgcolor: activeQuiz === module._key ? 'primary.dark' : alpha(theme.palette.primary.main, 0.15) },
                      '&.Mui-disabled': { bgcolor: alpha(theme.palette.action.disabledBackground, 0.1) }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <QuizIcon fontSize="small" sx={{ color: activeQuiz === module._key ? 'white' : 'inherit' }} />
                    </ListItemIcon>
                    <ListItemText primary="Desafio do Módulo" primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} />
                  </ListItemButton>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </SidebarWrapper>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile && (
        <IconButton 
          onClick={() => setMobileOpen(true)} 
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, boxShadow: 6 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Grid container sx={{ width: '100%' }}>
        {!isMobile && (
          <Grid item md={3} lg={2.5} sx={{ borderRight: '1px solid', borderColor: 'divider', position: 'sticky', top: 64, height: 'calc(100vh - 64px)' }}>
            {sidebarContent}
          </Grid>
        )}

        <Grid item xs={12} md={9} lg={9.5}>
          <ContentContainer>
            {activeQuiz ? (
              <ModuleQuiz
                courseId={course._id}
                quizKey={activeQuiz}
                title={activeQuiz === 'final' ? "Exame de Certificação" : "Avaliação de Módulo"}
                rawQuestions={activeQuiz === 'final' ? course.finalExam : course.modules.find(m => m._key === activeQuiz)?.exercises}
                onComplete={handleQuizComplete}
                isSaving={isSaving}
                isGuest={!signed}
              />
            ) : activeLesson ? (
              <Stack spacing={4} sx={{ maxWidth: 900, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="overline" color="primary" fontWeight="800" sx={{ letterSpacing: 1.5 }}>Aula Atual</Typography>
                    <Typography variant="h3" fontWeight="900" sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, color: 'text.primary' }}>{activeLesson.title}</Typography>
                  </Box>
                  <Button
                    variant={completedLessons.includes(activeLesson._key) ? "outlined" : "contained"}
                    color="success"
                    onClick={() => handleLessonToggle(activeLesson)}
                    startIcon={completedLessons.includes(activeLesson._key) ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                    sx={{ borderRadius: '10px', px: 3, py: 1, textTransform: 'none', fontWeight: 'bold' }}
                  >
                    {completedLessons.includes(activeLesson._key) ? "Concluída" : "Marcar como lida"}
                  </Button>
                </Box>
                
                <Divider />

                <Box sx={{ pb: 10, '& img': { maxWidth: '100%', borderRadius: 3, my: 3, boxShadow: theme.shadows[4] } }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {activeLesson.content}
                  </ReactMarkdown>
                </Box>
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h5" color="text.secondary">Selecione uma aula para começar.</Typography>
              </Box>
            )}
          </ContentContainer>
        </Grid>
      </Grid>

      <Drawer 
        anchor="left"
        open={mobileOpen} 
        onClose={() => setMobileOpen(false)} 
        PaperProps={{ sx: { width: 300, border: 'none' } }}
      >
        {sidebarContent}
      </Drawer>
    </Box>
  );
}