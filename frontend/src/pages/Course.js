import React, { useState, useEffect, useRef } from 'react';
import { useCourse } from '../contexts/CourseContext';
import { useParams } from 'react-router-dom';
import { client, urlFor } from '../client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import { 
  Typography, Box, Paper, Accordion, AccordionSummary, 
  AccordionDetails, CircularProgress, 
  Container, Table, TableCell, 
  TableContainer, IconButton, Tooltip,
  Chip, LinearProgress,
  Toolbar,
  Grid,
  Card,
  Rating
} from '@mui/material';
import { 
  ContentCopy, 
  // PictureAsPdf, 
  Check,
  AccessTime,
  TimerOutlined,
  Percent,
  AutoStoriesOutlined,
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';

// Importando seus componentes
import QuizSection from '../components/QuizSection';
import CertificateDialog from '../components/CertificateDialog';
import timeAgo from '../utils/timeAgo';

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
  const accordionRefs = useRef({});
  const { getCourseProgress } = useCourse();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState([]);
  const progressPercentage = getCourseProgress(course);
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
        // setTimeout(() => scrollToAccordion(nextKey), 300);
      }
    }
  };

  const scrollToAccordion = (key) => {
    accordionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAccordionChange = (key) => (event, isExpanded) => {
    setExpanded(prev => ({ ...prev, [key]: isExpanded }));
    // if (isExpanded) setTimeout(() => scrollToAccordion(key), 100);
  };

  // const handleDownloadPDF = () => {
  //   const element = document.getElementById('pdf-export-area');
  //   const opt = {
  //     margin: 10, filename: `${course?.title}.pdf`,
  //     image: { type: 'jpeg', quality: 0.98 },
  //     html2canvas: { scale: 2, useCORS: true },
  //     jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  //   };
  //   element.style.display = 'block';
  //   html2pdf().set(opt).from(element).save().then(() => element.style.display = 'none');
  // };

  const isFinalExamCompleted = completedSteps.includes('final-exam');

  const muiComponents = {
    h1: ({ children }) => <Typography lineHeight={1} sx={{ mb: 2 }}>{children}</Typography>,
    h2: ({ children }) => <Typography lineHeight={1} sx={{ mb: 2 }}>{children}</Typography>,
    h3: ({ children }) => <Typography lineHeight={1} sx={{ mb: 2 }}>{children}</Typography>,
    h4: ({ children }) => <Typography lineHeight={1} sx={{ mb: 2 }}>{children}</Typography>,
    p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, textAlign: 'justify', color: 'text.secondary' }}>{children}</Typography>,
    table: ({ children }) => (
      <TableContainer component={Paper} variant="outlined" sx={{ my: 3 }}><Table size="small">{children}</Table></TableContainer>
    ),
    th: ({ children }) => <TableCell sx={{ bgcolor: 'primary.main', color: '#fff' }}>{children}</TableCell>,
    td: ({ children }) => <TableCell>{children}</TableCell>,
    code: ({ inline, children }) => inline 
      ? <Box component="code" sx={{ bgcolor: 'action.selected', px: 0.8, borderRadius: 1 }}>{children}</Box>
      : <CodeBlock>{children}</CodeBlock>,
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}><Toolbar /><CircularProgress /></Box>;
  if (!course) return <Typography sx={{ p: 5, textAlign: 'center' }}>Curso não encontrado.</Typography>;

  return (
    <Box>
      {progressPercentage === 0 ? null : (
        <>
          <Box sx={{ position: 'fixed', top: 0, zIndex: 1100, width: '100%' }}>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              sx={{ height: 3 }} 
            />
          </Box>
        </>
      )}

      <Toolbar />
      <Box>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Grid
            alignItems="center"
            container
            spacing={{ xs: 0, lg: 2 }}
          >
            <Grid
              order={{ xs: 2, sm: 2, md: 2, lg: 1 }}
              size={{ xs: 12, sm: 12, md: 12, lg: 8 }}
            >
              <Typography variant="h6" gutterBottom>{course.title}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip 
                  label={course.category.name || "Geral"} 
                  size="small"
                  variant="outlined"
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" lineHeight={1}>
                    {timeAgo(course._createdAt)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ mb: 2 }}>{course.description}</Typography>
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: .5,
                  }}
                >
                  <Rating 
                    size="small" 
                    name="half-rating-read" 
                    defaultValue={course.rating} precision={0.5} readOnly 
                    emptyIcon={<StarIcon style={{ opacity: 0.5 }} fontSize="inherit" />}
                  />
                  <Typography variant='caption' color="text.secondary" lineHeight={1}>{course.rating.toFixed(1)}</Typography>
                </Box>

                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 1
                  }}
                >
                  {/* <IconButton color='inherit' onClick={handleDownloadPDF}><PictureAsPdf /></IconButton> */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AutoStoriesOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" lineHeight={1}>
                      {course.modules?.length || 0} aulas
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimerOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" lineHeight={1}>
                      {course.estimatedTime}h
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Percent sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" lineHeight={1}>
                      {progressPercentage}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid
              order={{ xs: 1, sm: 1, md: 1, lg: 2 }}
              size={{ xs: 12, sm: 12, md: 12, lg: 4 }}
            >
              {course.thumbnail && (
                <Card elevation={0} component="img" src={urlFor(course.thumbnail).url()} sx={{ width: '100%', height: { xs: 128, md: 256 }, objectFit: 'cover', p: 0 }} />
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
      <>
        <Box
          sx={{
            pb: 10
          }}
        >
          {course.modules?.map((module, index) => {
            const isCompleted = completedSteps.includes(module._key);
            // const isLocked = index > 0 && !completedSteps.includes(course.modules[index - 1]._key);

            return (
              <Accordion 
                key={module._key} 
                // disabled={isLocked}
                expanded={!!expanded[module._key]}
                onChange={handleAccordionChange(module._key)}
                ref={el => accordionRefs.current[module._key] = el}
                elevation={0}
                disableGutters
                variant='elevation'
                // sx={{ mb: 2, ':last-of-type': { mb: 0 }, borderColor: isCompleted ? 'success.light' : 'divider', transition: 'none' }}
                
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
                    <Typography variant='subtitle2' color='text.secondary' lineHeight={1}>{index + 1}.</Typography>
                    <Typography variant='subtitle2' lineHeight={1}>{module.title}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
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
            <Box sx={{ mt: 2 }}>
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
                my: 2
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
        </Box>
      </>
    </Box>
  );
}

export default Course;