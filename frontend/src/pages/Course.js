import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client, urlFor } from '../client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import { 
  Typography, Box, Paper, Accordion, AccordionSummary, 
  AccordionDetails, CircularProgress, 
  Container, Table, TableCell, 
  TableContainer, IconButton, Tooltip,
  Stack, Chip, LinearProgress
} from '@mui/material';
import { 
  ArrowBack, ContentCopy, PictureAsPdf, 
  Check
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Importando seus componentes
import QuizSection from '../components/QuizSection';
import CertificateDialog from '../components/CertificateDialog';

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

  const isFinalExamCompleted = completedSteps.includes('final-exam');

  const muiComponents = {
    h2: ({ children }) => <Typography variant="h5" sx={{ mb: 2, fontWeight: 800, borderLeft: '5px solid #1976d2', pl: 2, color: 'primary.main' }}>{children}</Typography>,
    h3: ({ children }) => <Typography variant="h5" sx={{ mb: 2, fontWeight: 800, borderLeft: '5px solid #1976d2', pl: 2, color: 'primary.main' }}>{children}</Typography>,
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
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1100, minHeight: '64px', bgcolor: 'background.paper', borderBottom: '1px solid divider' }}>
        <LinearProgress variant="determinate" value={progressPercentage} sx={{ height: 6 }} />
        <Container maxWidth="xl" sx={{ py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton color='primary' onClick={() => navigate('/')}><ArrowBack /></IconButton>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" fontWeight="bold" color="primary" lineHeight={1}>{progressPercentage}% CONCLUÍDO</Typography>
            <IconButton color='primary' onClick={handleDownloadPDF}><PictureAsPdf /></IconButton>
          </Stack>
        </Container>
      </Box>

      {course.thumbnail && (
        <Box component="img" src={urlFor(course.thumbnail).url()} sx={{ width: '100%', height: { xs: 128, md: 256 }, objectFit: 'cover' }} />
      )}
      <Paper elevation={0} sx={{ mb: 2, overflow: 'hidden' }}>
        <Container maxWidth="xl">
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label={course.category?.name || "Geral"} variant="outlined" color="primary" size="small" sx={{ fontWeight: 800 }} />
              <Chip label={progressPercentage === 100 ? "Concluído" : `${progressPercentage}%`} variant={progressPercentage === 100 ? "filled" : "outlined"} size="small" color={progressPercentage === 100 ? "success" : "primary"} />
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>{course.title}</Typography>
            <Typography variant="body1" color="text.secondary">{course.description}</Typography>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl">
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
              sx={{ mb: 2, ':last-of-type': { mb: 0 }, borderRadius: '16px !important', border: '1px solid', borderColor: isCompleted ? 'success.light' : 'divider' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700 }}>{index + 1}. {module.title}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails >
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
              type="exam" isCompleted={isFinalExamCompleted} 
              onComplete={() => handleStepComplete('final-exam')} 
              scrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </Box>
        )}

        {isFinalExamCompleted && (
          <Paper 
            elevation={0} 
            sx={{ 
              textAlign: 'center',
              mt: 4, mb: 4
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CertificateDialog courseTitle={course.title} />
            </Box>
          </Paper>
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
    </Box>
  );
}

export default Course;