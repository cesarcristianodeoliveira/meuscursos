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
  FormControlLabel, Paper, IconButton, Drawer, useMediaQuery, useTheme,
  Skeleton
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

// Ícones
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import QuizIcon from '@mui/icons-material/Quiz';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedIcon from '@mui/icons-material/Verified';
import MenuIcon from '@mui/icons-material/Menu';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// --- ESTILOS ---
const SidebarWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  '&::-webkit-scrollbar': { width: '4px' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.divider, borderRadius: '10px' }
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(3),
  [theme.breakpoints.up('md')]: { padding: theme.spacing(6) },
  backgroundColor: theme.palette.background.default,
}));

const StyledCardQuiz = styled(Card)(({ theme, status }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  borderLeft: `6px solid ${
    status === 'correct' ? theme.palette.success.main : 
    status === 'wrong' ? theme.palette.error.main : theme.palette.divider
  }`,
  backgroundColor: status === 'correct' ? alpha(theme.palette.success.main, 0.02) : 'inherit'
}));

const shuffleArray = (array) => [...(array || [])].sort(() => Math.random() - 0.5);

// --- COMPONENTE DE CERTIFICADO ---
const CertificateCanvas = ({ userName, courseTitle, date }) => {
  const canvasRef = React.useRef(null);

  const downloadCertificate = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `Certificado-${courseTitle.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Limpar e desenhar fundo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);
    
    // Borda Principal
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 30;
    ctx.strokeRect(15, 15, 770, 570);
    
    // Detalhe Dourado
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 720, 520);

    ctx.textAlign = 'center';
    
    // Cabeçalho
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px serif';
    ctx.fillText('CERTIFICADO DE CONCLUSÃO', 400, 150);

    ctx.fillStyle = '#64748b';
    ctx.font = '20px sans-serif';
    ctx.fillText('Conferimos este certificado a', 400, 220);

    // Nome do Aluno
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 42px serif';
    ctx.fillText(userName?.toUpperCase() || 'ESTUDANTE IACADEMY', 400, 290);

    ctx.fillStyle = '#64748b';
    ctx.font = '20px sans-serif';
    ctx.fillText('pela conclusão do curso avançado de', 400, 350);

    // Nome do Curso
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic bold 32px serif';
    ctx.fillText(courseTitle, 400, 410);

    // Rodapé
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    const dataFormatada = new Date(date).toLocaleDateString('pt-BR');
    ctx.fillText(`Emitido via IAcademy AI em ${dataFormatada}`, 400, 500);
    ctx.fillText('Validado por algoritmos de aprendizado adaptativo LXD', 400, 530);
  }, [userName, courseTitle, date]);

  return (
    <Stack spacing={3} alignItems="center" sx={{ mt: 2 }}>
      <canvas ref={canvasRef} width={800} height={600} style={{ width: '100%', maxWidth: '650px', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} />
      <Button variant="contained" color="primary" size="large" startIcon={<DownloadIcon />} onClick={downloadCertificate} sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: '900' }}>
        Download Certificado (PNG)
      </Button>
    </Stack>
  );
};

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
    <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto', pb: 10 }}>
      <Box>
        <Typography variant="h4" fontWeight="900" gutterBottom>{title}</Typography>
        <Typography variant="body1" color="text.secondary">
          {submitted ? `Você acertou ${score} de ${questions.length} questões.` : "Selecione a alternativa correta para cada questão."}
        </Typography>
      </Box>

      {questions.map((q, idx) => {
        const status = !submitted ? 'idle' : (answers[idx] === q.correctAnswer ? 'correct' : 'wrong');
        return (
          <StyledCardQuiz key={idx} variant="outlined" status={status}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '1.1rem' }}>
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
                    '&:hover': { bgcolor: !submitted ? alpha('#000', 0.03) : 'transparent' }
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
          disabled={Object.keys(answers).length < questions.length || isSaving} 
          sx={{ borderRadius: 3, py: 2, fontWeight: '900' }}
        >
          {isSaving ? "SALVANDO RESULTADO..." : "FINALIZAR QUIZ"}
        </Button>
      ) : (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '2px solid', borderColor: isWin ? 'success.main' : 'warning.main', bgcolor: 'background.paper' }}>
          <Typography variant="h5" fontWeight="900" color={isWin ? "success.main" : "warning.main"}>
            {isWin ? "🎯 PERFEITO! CONTEÚDO DOMINADO." : "QUASE LÁ! REVISE O CONTEÚDO."}
          </Typography>
          {!isWin && (
            <Button variant="outlined" sx={{ mt: 2, fontWeight: '700' }} onClick={() => { localStorage.removeItem(storageKey); initQuiz(); }}>
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
  
  const { signed, user, authLoading } = useAuth();
  const { getCourseProgress, updateLessonProgress, saveQuizResult } = useCourse();

  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeLesson, setActiveLesson] = React.useState(null);
  const [activeQuiz, setActiveQuiz] = React.useState(null);
  const [completedLessons, setCompletedLessons] = React.useState([]);
  const [courseStatus, setCourseStatus] = React.useState('em_andamento');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Sincronização de Scroll
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeLesson, activeQuiz]);

  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        const query = `*[_type == "course" && slug.current == $slug][0]{
          _id, title, description, level, _createdAt,
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
      } catch (err) { 
        console.error("Erro ao carregar curso:", err); 
        setLoading(false); 
      }
    };
    if (!authLoading) fetchCourse();
  }, [slug, authLoading, signed, getCourseProgress]);

  const handleLessonToggle = async (lesson) => {
    if (!signed) return navigate('/entrar');
    const lessonId = lesson._key;
    const isDone = completedLessons.includes(lessonId);
    
    // Feedback imediato na UI
    setCompletedLessons(prev => isDone ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
    
    await updateLessonProgress(course._id, { 
      lessonId, 
      lessonTitle: lesson.title, 
      completed: !isDone 
    });
  };

  const handleQuizComplete = async (score, total) => {
    if (!signed) return;
    setIsSaving(true);
    const isFinal = activeQuiz === 'final';
    const res = await saveQuizResult(course._id, {
      score, totalQuestions: total, isFinalExam: isFinal,
      isPassed: score === total, moduleKey: isFinal ? null : activeQuiz
    });
    if (res.success && res.status === 'concluido') setCourseStatus('concluido');
    setIsSaving(false);
  };

  const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const isCourseComplete = completedLessons.length >= totalLessons;

  if (loading || authLoading) return (
    <Box sx={{ p: 10, textAlign: 'center' }}>
      <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
      <Skeleton variant="text" width="60%" sx={{ mb: 4 }} />
      <Grid container spacing={4}>
        <Grid item xs={3}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} /></Grid>
        <Grid item xs={9}><Skeleton variant="rectangular" height={600} sx={{ borderRadius: 2 }} /></Grid>
      </Grid>
    </Box>
  );

  if (!course) return (
    <Box sx={{ p: 10, textAlign: 'center' }}>
      <Typography variant="h5">Curso não encontrado.</Typography>
      <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
    </Box>
  );

  const sidebarContent = (
    <SidebarWrapper>
      <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2, textTransform: 'none', fontWeight: '700' }}
        >
          Painel
        </Button>
        <Typography variant="h6" fontWeight="900" lineHeight={1.2}>{course.title}</Typography>
        <Stack direction="row" spacing={1} mt={2}>
          <Chip label={course.level?.toUpperCase()} size="small" sx={{ fontWeight: '800', fontSize: '0.65rem' }} />
          <Chip 
            label={`${Math.round((completedLessons.length / totalLessons) * 100)}%`} 
            size="small" color="primary" variant="outlined" 
            sx={{ fontWeight: '800', fontSize: '0.65rem' }} 
          />
        </Stack>
      </Box>
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {course.modules?.map((module) => {
          const doneInModule = module.lessons?.filter(l => completedLessons.includes(l._key)).length;
          const isModuleDone = doneInModule === module.lessons?.length;

          return (
            <Accordion key={module._key} elevation={0} disableGutters defaultExpanded sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="800" color="text.primary">{module.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{doneInModule}/{module.lessons?.length} Concluídas</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List disablePadding>
                  {module.lessons?.map((lesson) => (
                    <ListItemButton
                      key={lesson._key}
                      selected={activeLesson?._key === lesson._key}
                      onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); setMobileOpen(false); }}
                      sx={{ py: 1.5, pl: 3 }}
                    >
                      <ListItemIcon sx={{ minWidth: 35 }}>
                        {completedLessons.includes(lesson._key) 
                          ? <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} /> 
                          : <RadioButtonUncheckedIcon sx={{ fontSize: 20, color: 'divider' }} />}
                      </ListItemIcon>
                      <ListItemText primary={lesson.title} primaryTypographyProps={{ variant: 'body2', fontWeight: activeLesson?._key === lesson._key ? '700' : '400' }} />
                    </ListItemButton>
                  ))}
                  {module.exercises?.length > 0 && (
                    <ListItemButton
                      disabled={!isModuleDone}
                      selected={activeQuiz === module._key}
                      onClick={() => { setActiveQuiz(module._key); setActiveLesson(null); setMobileOpen(false); }}
                      sx={{ m: 1, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}
                    >
                      <ListItemIcon sx={{ minWidth: 35 }}><QuizIcon color="secondary" fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Quiz do Módulo" primaryTypographyProps={{ variant: 'caption', fontWeight: '900' }} />
                    </ListItemButton>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          fullWidth variant={activeQuiz === 'final' ? "contained" : "outlined"}
          color="success" disabled={!isCourseComplete}
          startIcon={<VerifiedIcon />}
          onClick={() => { setActiveQuiz('final'); setActiveLesson(null); setMobileOpen(false); }}
          sx={{ borderRadius: 3, py: 1.5, fontWeight: '900' }}
        >
          {courseStatus === 'concluido' ? "VER CERTIFICADO" : "EXAME FINAL"}
        </Button>
      </Box>
    </SidebarWrapper>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile && (
        <IconButton onClick={() => setMobileOpen(true)} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100, bgcolor: 'primary.main', color: 'white', boxShadow: 5, '&:hover': { bgcolor: 'primary.dark' } }}>
          <MenuIcon />
        </IconButton>
      )}

      <Grid container>
        {!isMobile && <Grid item md={3} lg={2.5} sx={{ height: '100vh', position: 'sticky', top: 0 }}>{sidebarContent}</Grid>}
        <Grid item xs={12} md={9} lg={9.5}>
          <ContentContainer>
            {activeQuiz === 'final' && courseStatus === 'concluido' ? (
              <Stack spacing={4} alignItems="center" sx={{ py: 4 }}>
                <Typography variant="h3" fontWeight="900" color="primary.dark" textAlign="center">Parabéns, {user?.name}!</Typography>
                <Typography variant="h6" color="text.secondary" textAlign="center">Sua dedicação rendeu frutos. Aqui está seu certificado oficial.</Typography>
                <CertificateCanvas userName={user?.name} courseTitle={course.title} date={new Date().toISOString()} />
              </Stack>
            ) : activeQuiz ? (
              <ModuleQuiz
                courseId={course._id} quizKey={activeQuiz}
                title={activeQuiz === 'final' ? "Exame de Certificação" : "Avaliação de Módulo"}
                rawQuestions={activeQuiz === 'final' ? course.finalExam : course.modules.find(m => m._key === activeQuiz)?.exercises}
                onComplete={handleQuizComplete} isSaving={isSaving} isGuest={!signed}
              />
            ) : activeLesson ? (
              <Stack spacing={4} sx={{ maxWidth: 900, mx: 'auto', pb: 10 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="overline" color="primary" fontWeight="900">LIÇÃO ATUAL</Typography>
                    <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: '-1px', lineHeight: 1.1 }}>{activeLesson.title}</Typography>
                  </Box>
                  <Button
                    variant={completedLessons.includes(activeLesson._key) ? "outlined" : "contained"}
                    color="success" onClick={() => handleLessonToggle(activeLesson)}
                    sx={{ borderRadius: 2, fontWeight: '900', px: 3 }}
                  >
                    {completedLessons.includes(activeLesson._key) ? "CONCLUÍDA" : "CONCLUIR AULA"}
                  </Button>
                </Box>
                
                <Divider />
                
                <Box className="markdown-container">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    components={{
                      h2: (p) => <Typography variant="h4" fontWeight="800" sx={{ mt: 6, mb: 3, color: 'text.primary' }} {...p} />,
                      h3: (p) => <Typography variant="h5" fontWeight="700" sx={{ mt: 4, mb: 2 }} {...p} />,
                      p: (p) => <Typography variant="body1" sx={{ mb: 3, fontSize: '1.15rem', lineHeight: 1.8, color: 'text.secondary' }} {...p} />,
                      ul: (p) => <Box component="ul" sx={{ mb: 3, pl: 4 }} {...p} />,
                      li: (p) => <Typography component="li" variant="body1" sx={{ mb: 1, color: 'text.secondary' }} {...p} />,
                      blockquote: (p) => <Box component="blockquote" sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 3, my: 4, fontStyle: 'italic', color: 'text.secondary' }} {...p} />,
                      code: ({ inline, ...p }) => inline 
                        ? <Typography component="code" sx={{ bgcolor: 'action.hover', px: 1, borderRadius: 1, fontFamily: 'monospace', color: 'secondary.main' }} {...p} /> 
                        : <Box component="pre" sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3, borderRadius: 3, overflow: 'auto', my: 4, boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}><code {...p} /></Box>
                    }}
                  >
                    {activeLesson.content}
                  </ReactMarkdown>
                </Box>
              </Stack>
            ) : null}
          </ContentContainer>
        </Grid>
      </Grid>
      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: '85%' } }}>
        {sidebarContent}
      </Drawer>
    </Box>
  );
}