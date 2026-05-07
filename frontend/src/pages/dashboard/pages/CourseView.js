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
  Divider, Button, Chip, Accordion,
  AccordionSummary, AccordionDetails, Radio, RadioGroup,
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

// --- ESTILOS ---
const SidebarWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  overflowY: 'auto',
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  '&::-webkit-scrollbar': { width: '4px' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.divider, borderRadius: '10px' }
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 64px)',
  padding: theme.spacing(3),
  [theme.breakpoints.up('md')]: { padding: theme.spacing(6) },
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
        <Typography variant="h4" fontWeight="900" color="primary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isWin ? "Você concluiu este desafio com sucesso!" : "Responda corretamente para progredir."}
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
                    bgcolor: submitted && opt === q.correctAnswer ? alpha('#4caf50', 0.1) : 'transparent',
                  }}
                />
              ))}
            </RadioGroup>
          </StyledCardQuiz>
        );
      })}

      {!submitted ? (
        <Button 
          variant="contained" fullWidth size="large"
          onClick={handleSubmit} 
          disabled={(!isGuest && Object.keys(answers).length < questions.length) || isSaving} 
          sx={{ borderRadius: 3, py: 2, fontWeight: 'bold' }}
        >
          {isSaving ? "Salvando..." : isGuest ? "Faça login para responder" : "Enviar Respostas"}
        </Button>
      ) : (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: isWin ? alpha('#4caf50', 0.05) : alpha('#f44336', 0.05), border: '1px solid', borderColor: isWin ? 'success.main' : 'error.main' }}>
          <Typography variant="h5" fontWeight="900" color={isWin ? "success.main" : "error.main"}>
            {isWin ? "🎯 Excelente! Conteúdo Dominado." : `Você acertou ${score} de ${questions.length}`}
          </Typography>
          {!isWin && (
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => { localStorage.removeItem(storageKey); initQuiz(); }}>
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

  // Cálculo para o Exame Final
  const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const isCourseComplete = completedLessons.length >= totalLessons;

  if (loading || authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="button" sx={{ letterSpacing: 2 }}>Carregando Ambiente...</Typography>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <Typography variant="h6">Curso não encontrado.</Typography>
      </Box>
    );
  }

  const sidebarContent = (
    <SidebarWrapper>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="900">{course.title}</Typography>
        <Stack direction="row" spacing={1} mt={1}>
          <Chip label={course.level} size="small" variant="outlined" />
          {courseStatus === 'concluido' && <Chip icon={<VerifiedIcon />} label="Certificado" color="success" size="small" />}
        </Stack>
      </Box>
      <Divider />
      {course.modules?.map((module) => {
        const doneInModule = module.lessons?.filter(l => completedLessons.includes(l._key)).length;
        const isModuleDone = doneInModule === module.lessons?.length;

        return (
          <Accordion key={module._key} elevation={0} defaultExpanded sx={{ bgcolor: 'transparent' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box>
                <Typography variant="subtitle2" fontWeight="700">{module.title}</Typography>
                <Typography variant="caption">{doneInModule}/{module.lessons?.length} aulas</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List disablePadding>
                {module.lessons?.map((lesson) => (
                  <ListItemButton
                    key={lesson._key}
                    selected={activeLesson?._key === lesson._key}
                    onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); setMobileOpen(false); window.scrollTo(0,0); }}
                  >
                    <ListItemIcon sx={{ minWidth: 35 }}>
                      {completedLessons.includes(lesson._key) ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon color="disabled" />}
                    </ListItemIcon>
                    <ListItemText primary={lesson.title} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItemButton>
                ))}
                {module.exercises?.length > 0 && (
                  <ListItemButton
                    disabled={!isModuleDone}
                    selected={activeQuiz === module._key}
                    onClick={() => { setActiveQuiz(module._key); setActiveLesson(null); setMobileOpen(false); window.scrollTo(0,0); }}
                    sx={{ m: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                  >
                    <ListItemIcon sx={{ minWidth: 35 }}><QuizIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Quiz do Módulo" primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} />
                  </ListItemButton>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Box sx={{ p: 2, mt: 'auto' }}>
        <Divider sx={{ mb: 2 }} />
        <Button
          fullWidth variant={activeQuiz === 'final' ? "contained" : "outlined"}
          color="secondary" disabled={!isCourseComplete}
          startIcon={<VerifiedIcon />}
          onClick={() => { setActiveQuiz('final'); setActiveLesson(null); setMobileOpen(false); window.scrollTo(0,0); }}
          sx={{ borderRadius: 3, py: 1.5, fontWeight: 'bold' }}
        >
          Exame Final
        </Button>
      </Box>
    </SidebarWrapper>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile && (
        <IconButton onClick={() => setMobileOpen(true)} sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1100, bgcolor: 'primary.main', color: 'white', boxShadow: 3 }}>
          <MenuIcon />
        </IconButton>
      )}

      <Grid container>
        {!isMobile && <Grid item md={3} lg={2.5} sx={{ borderRight: '1px solid', borderColor: 'divider', height: '100vh', position: 'sticky', top: 0 }}>{sidebarContent}</Grid>}
        <Grid item xs={12} md={9} lg={9.5}>
          <ContentContainer>
            {activeQuiz ? (
              <ModuleQuiz
                courseId={course._id} quizKey={activeQuiz}
                title={activeQuiz === 'final' ? "Exame de Certificação" : "Quiz de Módulo"}
                rawQuestions={activeQuiz === 'final' ? course.finalExam : course.modules.find(m => m._key === activeQuiz)?.exercises}
                onComplete={handleQuizComplete} isSaving={isSaving} isGuest={!signed}
              />
            ) : activeLesson ? (
              <Stack spacing={4} sx={{ maxWidth: 850, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h4" fontWeight="900">{activeLesson.title}</Typography>
                  <Button
                    variant={completedLessons.includes(activeLesson._key) ? "outlined" : "contained"}
                    color="success" onClick={() => handleLessonToggle(activeLesson)}
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                  >
                    {completedLessons.includes(activeLesson._key) ? "Concluída" : "Marcar Concluída"}
                  </Button>
                </Box>
                <Divider />
                <Box sx={{ pb: 10 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                    h2: (p) => <Typography variant="h5" fontWeight="800" sx={{ mt: 4, mb: 2 }} {...p} />,
                    p: (p) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: 'text.secondary' }} {...p} />,
                    code: ({ inline, ...p }) => inline ? <code style={{ backgroundColor: '#eee', padding: '2px 4px' }} {...p} /> : <pre style={{ background: '#222', color: '#fff', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}><code {...p} /></pre>
                  }}>
                    {activeLesson.content}
                  </ReactMarkdown>
                </Box>
              </Stack>
            ) : (
                <Typography>Selecione um conteúdo</Typography>
            )}
          </ContentContainer>
        </Grid>
      </Grid>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>{sidebarContent}</Drawer>
    </Box>
  );
}