import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client, urlFor } from '../client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import { 
  Typography, Box, Paper, Accordion, AccordionSummary, 
  AccordionDetails, Button, CircularProgress, 
  Container, Table, TableCell, 
  TableContainer, IconButton, Tooltip,
  Radio, RadioGroup, FormControlLabel, FormControl, Alert, Stack, Chip,
  LinearProgress
} from '@mui/material';
import { 
  ArrowBack, ContentCopy, PictureAsPdf, 
  Check, Assignment, EmojiEvents,
  CheckCircleOutline, RadioButtonUnchecked, Lock as LockIcon
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CertificateDialog from '../components/CertificateDialog';

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

// --- COMPONENTE QUIZ CORRIGIDO ---
const QuizSection = ({ courseId, moduleKey, title, questions, type = "exercise", onComplete, isCompleted, scrollToTop }) => {
  const storageKey = `quiz-${courseId}-${moduleKey}`;
  
  // Carrega respostas do cache
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  });

  // Estado de exibição do resultado: true se já completou ou se respondeu tudo anteriormente
  const [showResult, setShowResult] = useState(() => {
    if (isCompleted) return true;
    const saved = localStorage.getItem(storageKey);
    const savedAnswers = saved ? JSON.parse(saved) : {};
    return questions.length > 0 && Object.keys(savedAnswers).length === questions.length;
  });

  const [score, setScore] = useState(0);

  // Embaralha uma vez
  const shuffledQuestions = useMemo(() => {
    return shuffleArray(questions.map(q => ({
      ...q,
      options: shuffleArray(q.options || [])
    })));
  }, [questions]);

  // Calcula o score sempre que carregar ou mudar respostas
  useEffect(() => {
    let hits = 0;
    shuffledQuestions.forEach((q) => {
      if (answers[q.question] === q.correctAnswer) hits++;
    });
    setScore(hits);
  }, [answers, shuffledQuestions]);

  // Efeito para validar automaticamente com pequeno delay
  useEffect(() => {
    const total = shuffledQuestions.length;
    const answeredCount = Object.keys(answers).length;

    if (total > 0 && answeredCount === total && !showResult) {
      const timer = setTimeout(() => {
        setShowResult(true);
        // Sempre salva as respostas no localStorage ao finalizar
        localStorage.setItem(storageKey, JSON.stringify(answers));
        
        // Só chama a conclusão do módulo se acertar >= 50%
        let hits = 0;
        shuffledQuestions.forEach((q) => {
          if (answers[q.question] === q.correctAnswer) hits++;
        });

        if ((hits / total) >= 0.5) {
          if (onComplete) onComplete();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [answers, shuffledQuestions, showResult, onComplete, storageKey]);

  const handleRetry = () => {
    setAnswers({});
    setShowResult(false);
    setScore(0);
    localStorage.removeItem(storageKey);
    if (scrollToTop) scrollToTop();
  };

  if (!questions || questions.length === 0) return null;

  return (
    <Box sx={{ 
      mt: 4, p: 3, borderRadius: 3, bgcolor: 'action.hover', border: '1px dashed', 
      borderColor: showResult ? (score >= shuffledQuestions.length / 2 ? 'success.main' : 'error.main') : 'primary.main' 
    }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', fontWeight: 700 }}>
        {type === "exam" ? <EmojiEvents sx={{ mr: 1, color: '#FFD700' }} /> : <Assignment sx={{ mr: 1, color: 'primary.main' }} />}
        {title}
      </Typography>
      
      {shuffledQuestions.map((q, qIdx) => (
        <Box key={qIdx} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{qIdx + 1}. {q.question}</Typography>
          <FormControl component="fieldset">
            <RadioGroup 
              value={answers[q.question] || ''} 
              onChange={(e) => setAnswers(prev => ({ ...prev, [q.question]: e.target.value }))}
            >
              {q.options.map((opt, oIdx) => (
                <FormControlLabel 
                  key={oIdx} 
                  value={opt} 
                  control={<Radio size="small" />} 
                  label={<Typography variant="body2">{opt}</Typography>} 
                  disabled={showResult} 
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      ))}

      {showResult && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Alert severity={score >= (shuffledQuestions.length / 2) || isCompleted ? "success" : "error"}>
            {isCompleted || score >= (shuffledQuestions.length / 2) 
              ? `Parabéns! Você acertou ${score} de ${shuffledQuestions.length}.` 
              : `Você acertou ${score} de ${shuffledQuestions.length}. Tente revisar o conteúdo.`}
          </Alert>
          {(score < (shuffledQuestions.length / 2) && !isCompleted) && (
            <Button variant="outlined" color="error" onClick={handleRetry} sx={{ alignSelf: 'flex-start' }}>
              Tentar Novamente
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
};

const CodeBlock = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Box sx={{ position: 'relative', my: 2 }}>
      <Tooltip placement='left' title={copied ? "Copiado" : "Copiar"}>
        <IconButton onClick={handleCopy} size="small" sx={{ position: 'absolute', right: 8, top: 8, color: 'grey.500', zIndex: 1 }}>
          {copied ? <Check fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Box component="pre" sx={{ p: 2, borderRadius: 2, overflowX: 'auto', bgcolor: '#1e1e1e', color: '#fff', fontSize: '0.85rem' }}>
        <code>{children}</code>
      </Box>
    </Box>
  );
};

function Course() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const accordionRefs = useRef({});
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [openCert, setOpenCert] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const query = `*[_type == "course" && slug.current == $slug][0]`;
    client.fetch(query, { slug }).then((data) => {
      setCourse(data);
      const saved = localStorage.getItem(`progress-${data?._id}`);
      const progress = saved ? JSON.parse(saved) : [];
      setCompletedSteps(progress);
      
      const initialExpanded = {};
      let firstIncompleteFound = false;
      data.modules?.forEach((mod) => {
        const isDone = progress.includes(mod._key);
        if (isDone || !firstIncompleteFound) {
          initialExpanded[mod._key] = true;
          if (!isDone) firstIncompleteFound = true;
        }
      });
      setExpanded(initialExpanded);
      setLoading(false);
    });
  }, [slug]);

  const handleStepComplete = (key) => {
    if (!completedSteps.includes(key)) {
      const newSteps = [...completedSteps, key];
      setCompletedSteps(newSteps);
      localStorage.setItem(`progress-${course._id}`, JSON.stringify(newSteps));
      
      const currentIndex = course.modules.findIndex(m => m._key === key);
      if (currentIndex < course.modules.length - 1) {
        const nextKey = course.modules[currentIndex + 1]._key;
        setExpanded(prev => ({ ...prev, [nextKey]: true }));
        setTimeout(() => scrollToAccordion(nextKey), 300);
      }
      if (key === 'final-exam') setOpenCert(true);
    }
  };

  const scrollToAccordion = (key) => {
    accordionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAccordionChange = (key) => (event, isExpanded) => {
    setExpanded(prev => ({ ...prev, [key]: isExpanded }));
    if (isExpanded) setTimeout(() => scrollToAccordion(key), 100);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('pdf-export-area');
    const opt = {
      margin: 10, filename: `Curso-${course?.title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    element.style.display = 'block';
    html2pdf().set(opt).from(element).save().then(() => element.style.display = 'none');
  };

  const progressPercentage = useMemo(() => {
    if (!course) return 0;
    const total = (course.modules?.length || 0) + (course.finalExam ? 1 : 0);
    return Math.round((completedSteps.length / total) * 100);
  }, [completedSteps, course]);

  const muiComponents = {
    h2: ({ children }) => <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 800, borderLeft: '5px solid #1976d2', pl: 2, color: 'primary.main' }}>{children}</Typography>,
    p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, textAlign: 'justify', color: 'text.secondary' }}>{children}</Typography>,
    table: ({ children }) => (
      <TableContainer component={Paper} variant="outlined" sx={{ my: 3 }}><Table size="small">{children}</Table></TableContainer>
    ),
    th: ({ children }) => <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: '#fff' }}>{children}</TableCell>,
    td: ({ children }) => <TableCell>{children}</TableCell>,
    code: ({ inline, children }) => inline 
      ? <Box component="code" sx={{ bgcolor: 'action.selected', px: 0.8, borderRadius: 1, fontWeight: 'bold' }}>{children}</Box>
      : <CodeBlock>{children}</CodeBlock>,
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!course) return <Typography sx={{ p: 5, textAlign: 'center' }}>Curso não encontrado.</Typography>;

  return (
    <Box>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1100, bgcolor: 'background.paper', borderBottom: '1px solid divider' }}>
        <LinearProgress variant="determinate" value={progressPercentage} sx={{ height: 6 }} />
        <Container maxWidth="xl" sx={{ py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/')}>Voltar</Button>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" fontWeight="bold" color="primary">{progressPercentage}% CONCLUÍDO</Typography>
            <Button size="small" variant="contained" startIcon={<PictureAsPdf />} onClick={handleDownloadPDF}>PDF</Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ mb: 4, borderRadius: 4, border: '1px solid divider', overflow: 'hidden' }}>
          {course.thumbnail && (
            <Box component="img" src={urlFor(course.thumbnail).width(1200).url()} sx={{ width: '100%', height: { xs: 200, md: 350 }, objectFit: 'cover' }} />
          )}
          <Box sx={{ p: 4 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label={course.category?.name || "Geral"} color="primary" size="small" sx={{ fontWeight: 800 }} />
              <Chip label={progressPercentage === 100 ? "Concluído" : `${progressPercentage}%`} variant="outlined" size="small" color="primary" />
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>{course.title}</Typography>
            <Typography variant="body1" color="text.secondary">{course.description}</Typography>
          </Box>
        </Paper>

        {course.modules?.map((module, index) => {
          const isCompleted = completedSteps.includes(module._key);
          const isLocked = index > 0 && !completedSteps.includes(course.modules[index - 1]._key);

          return (
            <Accordion 
              key={module._key} 
              disabled={isLocked}
              expanded={!!expanded[module._key]}
              onChange={handleAccordionChange(module._key)}
              ref={el => accordionRefs.current[module._key] = el}
              sx={{ mb: 2, borderRadius: '16px !important', border: '1px solid', borderColor: isCompleted ? 'success.light' : 'divider' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isCompleted ? <CheckCircleOutline color="success" /> : isLocked ? <LockIcon color="disabled" /> : <RadioButtonUnchecked color="disabled" />}
                  <Typography sx={{ fontWeight: 700 }}>{index + 1}. {module.title}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 2, md: 4 } }}>
                <ReactMarkdown components={muiComponents} remarkPlugins={[remarkGfm]}>{module.content}</ReactMarkdown>
                <QuizSection 
                  courseId={course._id} moduleKey={module._key}
                  title="Exercícios" questions={module.exercises} 
                  isCompleted={isCompleted} onComplete={() => handleStepComplete(module._key)} 
                  scrollToTop={() => scrollToAccordion(module._key)}
                />
              </AccordionDetails>
            </Accordion>
          );
        })}

        {course.modules?.every(m => completedSteps.includes(m._key)) && course.finalExam && (
          <Box sx={{ mt: 5 }}>
            <QuizSection 
              courseId={course._id} moduleKey="final-exam"
              title="Avaliação Final" questions={course.finalExam} 
              type="exam" isCompleted={completedSteps.includes('final-exam')} 
              onComplete={() => handleStepComplete('final-exam')} 
              scrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </Box>
        )}

        <Box id="pdf-export-area" sx={{ display: 'none' }}>
           <Typography variant="h2">{course.title}</Typography>
           {course.modules?.map((m, i) => (
             <Box key={i} sx={{ mb: 4 }}>
               <Typography variant="h4">{m.title}</Typography>
               <ReactMarkdown>{m.content}</ReactMarkdown>
             </Box>
           ))}
        </Box>
      </Container>
      <CertificateDialog open={openCert} onClose={() => setOpenCert(false)} courseTitle={course.title} />
    </Box>
  );
}

export default Course;