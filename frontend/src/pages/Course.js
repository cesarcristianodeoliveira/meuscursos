import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client, urlFor } from '../client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import { 
  Typography, Box, Paper, Accordion, AccordionSummary, 
  AccordionDetails, Button, CircularProgress, 
  Container, Table, TableCell, 
  TableContainer, IconButton, Tooltip, Divider,
  Radio, RadioGroup, FormControlLabel, FormControl, Alert, Stack, Rating, Chip
} from '@mui/material';
import { 
  ArrowBack, MenuBook, ContentCopy, PictureAsPdf, 
  Check, Assignment, QueryBuilder, AutoAwesome, EmojiEvents 
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// --- COMPONENTE INTERATIVO DE QUIZ ---
const QuizSection = ({ title, questions, type = "exercise" }) => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  if (!questions || questions.length === 0) return null;

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    setScore(correct);
    setShowResult(true);
  };

  return (
    <Box sx={{ 
      mt: 4, p: 3, borderRadius: 3, 
      bgcolor: type === 'exam' ? 'primary.soft' : 'action.hover', 
      border: '1px dashed', 
      borderColor: 'primary.main' 
    }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', fontWeight: 700 }}>
        {type === "exam" ? <EmojiEvents sx={{ mr: 1, color: '#FFD700' }} /> : <Assignment sx={{ mr: 1, color: 'primary.main' }} />}
        {title}
      </Typography>

      {questions.map((q, qIdx) => (
        <Box key={qIdx} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {qIdx + 1}. {q.question}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={answers[qIdx] || ''}
              onChange={(e) => setAnswers({ ...answers, [qIdx]: e.target.value })}
            >
              {q.options?.map((opt, oIdx) => (
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
          {showResult && (
            <Box sx={{ mt: 1 }}>
              {answers[qIdx] === q.correctAnswer ? (
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Check fontSize="inherit" /> Resposta correta!
                </Typography>
              ) : (
                <Typography variant="caption" color="error.main">
                  Resposta incorreta. A correta é: <strong>{q.correctAnswer}</strong>
                </Typography>
              )}
            </Box>
          )}
        </Box>
      ))}

      {!showResult ? (
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={Object.keys(answers).length < questions.length}
          sx={{ borderRadius: 2 }}
        >
          Enviar Respostas
        </Button>
      ) : (
        <Alert severity={score === questions.length ? "success" : "info"} sx={{ mt: 2, borderRadius: 2 }}>
          Você acertou {score} de {questions.length} questões!
          {score === questions.length && " Desempenho excelente!"}
        </Alert>
      )}
    </Box>
  );
};

// --- COMPONENTE DE BLOCO DE CÓDIGO ---
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
      <Box component="pre" sx={{ 
        p: 2, borderRadius: 2, overflowX: 'auto',
        bgcolor: '#1e1e1e', color: '#fff', fontSize: '0.85rem',
        border: '1px solid #333'
      }}>
        <code>{children}</code>
      </Box>
    </Box>
  );
};

function Course() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = `*[_type == "course" && slug.current == $slug][0]`;
    client.fetch(query, { slug }).then((data) => {
      setCourse(data);
      setLoading(false);
    });
  }, [slug]);

  const handleDownloadPDF = () => {
    const element = document.getElementById('pdf-export-area');
    const opt = {
      margin: [10, 5, 10, 5],
      filename: `Curso-${course?.title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], before: '.page-break' }
    };

    element.style.display = 'block';
    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
    });
  };

  const muiComponents = {
    h2: ({ children }) => <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 800, borderLeft: '5px solid #1976d2', pl: 2, color: 'primary.main' }}>{children}</Typography>,
    h3: ({ children }) => <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 700 }}>{children}</Typography>,
    p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, textAlign: 'justify', color: 'text.secondary' }}>{children}</Typography>,
    table: ({ children }) => (
      <TableContainer component={Paper} variant="outlined" sx={{ my: 3 }}><Table size="small">{children}</Table></TableContainer>
    ),
    th: ({ children }) => <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: '#fff' }}>{children}</TableCell>,
    td: ({ children }) => <TableCell>{children}</TableCell>,
    code: ({ inline, children }) => inline 
      ? <Box component="code" sx={{ bgcolor: 'action.selected', px: 0.8, borderRadius: 1, fontWeight: 'bold', color: 'primary.main' }}>{children}</Box>
      : <CodeBlock>{children}</CodeBlock>,
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!course) return <Box sx={{ p: 5, textAlign: 'center' }}><Typography>Curso não encontrado.</Typography></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* HEADER ACTIONS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ fontWeight: 'bold' }}>Voltar</Button>
        <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handleDownloadPDF} sx={{ borderRadius: 2 }}>Baixar PDF</Button>
      </Box>

      {/* CAPA E INFO */}
      <Paper elevation={0} sx={{ mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {course.thumbnail && (
          <Box component="img" src={urlFor(course.thumbnail).width(1200).url()} sx={{ width: '100%', height: { xs: 200, md: 400 }, objectFit: 'cover' }} />
        )}
        <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip label={course.category?.name || "Geral"} color="primary" size="small" sx={{ fontWeight: 800 }} />
            {course.aiModel && (
              <Chip icon={<AutoAwesome sx={{ fontSize: '14px !important' }} />} label={course.aiModel} variant="outlined" size="small" />
            )}
          </Stack>
          
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 2 }}>{course.title}</Typography>
          
          <Stack direction="row" spacing={3} sx={{ mb: 3, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QueryBuilder fontSize="small" />
              <Typography variant="body2">{course.estimatedTime}h de conteúdo</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating value={course.rating || 5} readOnly precision={0.5} size="small" />
              <Typography variant="body2" fontWeight="bold">({course.rating || '5.0'})</Typography>
            </Box>
          </Stack>

          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '800px', lineHeight: 1.7 }}>
            {course.description}
          </Typography>
        </Box>
      </Paper>

      {/* LISTA DE MÓDULOS */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <MenuBook color="primary" /> Grade Curricular
      </Typography>

      {course.modules?.map((module, index) => (
        <Accordion 
          key={module._key || index} 
          defaultExpanded={index === 0}
          sx={{ 
            mb: 2, border: '1px solid', borderColor: 'divider', 
            borderRadius: '16px !important', 
            boxShadow: 'none',
            '&:before': { display: 'none' } 
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 700 }}>{index + 1}. {module.title}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', p: { xs: 2, md: 4 } }}>
            <ReactMarkdown components={muiComponents} remarkPlugins={[remarkGfm]}>
              {module.content}
            </ReactMarkdown>
            
            {/* Exercícios do Módulo */}
            {module.exercises && (
              <QuizSection title="Exercícios de Fixação" questions={module.exercises} />
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* PROVA FINAL */}
      {course.finalExam && (
        <Box sx={{ mt: 6, mb: 8 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EmojiEvents sx={{ color: '#FFD700' }} /> Avaliação Final
          </Typography>
          <QuizSection title="Exame de Certificação" questions={course.finalExam} type="exam" />
        </Box>
      )}

      {/* ÁREA INVISÍVEL PARA PDF */}
      <Box id="pdf-export-area" sx={{ display: 'none', p: 4, color: '#000' }}>
         <Typography variant="h2">{course.title}</Typography>
         <Typography variant="h5" sx={{ mb: 4 }}>{course.description}</Typography>
         <Divider sx={{ my: 4 }} />
         {course.modules?.map((m, i) => (
           <Box key={i} className="page-break" sx={{ mb: 4 }}>
             <Typography variant="h4">{i+1}. {m.title}</Typography>
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
           </Box>
         ))}
      </Box>
    </Container>
  );
}

export default Course;