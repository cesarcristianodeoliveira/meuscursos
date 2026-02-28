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
  TableContainer, IconButton, Tooltip, Divider
} from '@mui/material';
import { ArrowBack, MenuBook, ContentCopy, PictureAsPdf, Check } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CodeBlock = ({ children }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: 'relative', my: 2 }}>
      <Tooltip title={copied ? "Copiado!" : "Copiar código"}>
        <IconButton 
          onClick={handleCopy}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8, color: 'grey.500', zIndex: 1 }}
        >
          {copied ? <Check fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Box component="pre" sx={{ 
        p: 2, borderRadius: 2, overflowX: 'auto',
        bgcolor: '#1e1e1e', color: '#fff', fontSize: '0.85rem',
        border: '1px solid #333',
        // Estilo fixo para o PDF (Independente do Theme)
        '.pdf-export &': { bgcolor: '#f4f4f4 !important', color: '#000 !important', border: '1px solid #ddd !important' }
      }}>
        <code style={{ color: 'inherit' }}>{children}</code>
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
      margin: [10, 0, 10, 0], // Margens laterais zeradas para o banner ocupar tudo
      filename: `Curso-${course?.title}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        windowWidth: 1000 // Simula uma tela larga para o layout ficar "fino"
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], before: '.page-break' }
    };

    element.style.display = 'block';
    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
    });
  };

  // Componentes com cores "Blindadas" para o PDF
  const muiComponents = {
    h2: ({ children }) => (
      <Typography variant="h5" sx={{ 
        mt: 4, mb: 2, fontWeight: 800, borderLeft: '5px solid #1976d2', pl: 2, color: 'primary.main',
        '.pdf-export &': { color: '#1976d2 !important' } 
      }}>{children}</Typography>
    ),
    h3: ({ children }) => (
      <Typography variant="h6" sx={{ 
        mt: 3, mb: 1, fontWeight: 700,
        '.pdf-export &': { color: '#000 !important' }
      }}>{children}</Typography>
    ),
    p: ({ children }) => (
      <Typography variant="body1" sx={{ 
        mb: 2, lineHeight: 1.8, textAlign: 'justify', color: 'text.secondary',
        '.pdf-export &': { color: '#222 !important' }
      }}>{children}</Typography>
    ),
    table: ({ children }) => (
      <TableContainer component={Paper} variant="outlined" sx={{ my: 3, '.pdf-export &': { border: '1px solid #eee !important', bgcolor: '#fff !important' } }}>
        <Table size="small">{children}</Table>
      </TableContainer>
    ),
    th: ({ children }) => (
      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: '#fff', '.pdf-export &': { bgcolor: '#1976d2 !important', color: '#fff !important' } }}>{children}</TableCell>
    ),
    td: ({ children }) => (
      <TableCell sx={{ '.pdf-export &': { color: '#000 !important', borderColor: '#eee !important' } }}>{children}</TableCell>
    ),
    code: ({ inline, children }) => inline 
      ? <Box component="code" sx={{ bgcolor: 'action.selected', px: 0.8, borderRadius: 1, fontWeight: 'bold', color: 'primary.main', '.pdf-export &': { bgcolor: '#eee !important', color: '#d32f2f !important' } }}>{children}</Box>
      : <CodeBlock>{children}</CodeBlock>,
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* HEADER WEB */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ fontWeight: 'bold' }}>Voltar</Button>
        <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handleDownloadPDF} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
          Baixar PDF
        </Button>
      </Box>

      {/* CONTEÚDO WEB (NORMAL) */}
      <Box>
        <Paper elevation={0} sx={{ mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {course.thumbnail && (
            <Box component="img" src={urlFor(course.thumbnail).width(1200).url()} sx={{ width: '100%', height: { xs: 200, md: 350 }, objectFit: 'cover' }} />
          )}
          <Box sx={{ p: 4 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 900 }}>{course.category}</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>{course.title}</Typography>
            <Typography variant="body1" color="text.secondary">{course.description}</Typography>
          </Box>
        </Paper>

        <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, display: 'flex', alignItems: 'center' }}>
          <MenuBook sx={{ mr: 1.5, color: 'primary.main' }} /> Conteúdo do Curso
        </Typography>

        {course.modules?.map((module, index) => (
          <Accordion key={module._key || index} defaultExpanded={index === 0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', boxShadow: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography sx={{ fontWeight: 700 }}>{index + 1}. {module.title}</Typography></AccordionSummary>
            <AccordionDetails sx={{ borderTop: '1px solid #eee', pt: 3 }}>
              <ReactMarkdown components={muiComponents} remarkPlugins={[remarkGfm]}>{module.content}</ReactMarkdown>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* --- ÁREA DE EXPORTAÇÃO PDF (FORÇANDO CORES FIXAS) --- */}
      <Box id="pdf-export-area" className="pdf-export" sx={{ display: 'none', bgcolor: '#fff !important', width: '100%' }}>
        
        {/* Banner do PDF idêntico ao da Web mas com cores fixas */}
        <Box sx={{ bgcolor: '#fff !important', pb: 4 }}>
          {course.thumbnail && (
            <Box component="img" src={urlFor(course.thumbnail).width(1200).url()} sx={{ width: '100%', height: 350, objectFit: 'cover', display: 'block' }} />
          )}
          <Box sx={{ p: 5 }}>
            <Typography sx={{ color: '#1976d2 !important', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.9rem', mb: 1 }}>{course.category}</Typography>
            <Typography sx={{ color: '#000 !important', fontWeight: 900, fontSize: '3rem', lineHeight: 1.2 }}>{course.title}</Typography>
            <Typography sx={{ color: '#444 !important', mt: 2, fontSize: '1.2rem', lineHeight: 1.6 }}>{course.description}</Typography>
          </Box>
          <Divider sx={{ mx: 5, borderColor: '#eee !important' }} />
        </Box>

        <Box sx={{ px: 5, bgcolor: '#fff !important' }}>
          {course.modules?.map((module, index) => (
            <Box key={`pdf-mod-${index}`} className="page-break" sx={{ mb: 6, pt: 4, bgcolor: '#fff !important' }}>
              {/* Título do Módulo Estilizado */}
              <Box sx={{ bgcolor: '#f1f5f9 !important', p: 3, borderRadius: '12px', mb: 4, borderLeft: '8px solid #1976d2' }}>
                <Typography sx={{ color: '#000 !important', fontWeight: 800, fontSize: '1.5rem' }}>
                  {index + 1}. {module.title}
                </Typography>
              </Box>
              
              {/* Conteúdo Markdown */}
              <Box sx={{ px: 1, bgcolor: '#fff !important' }}>
                <ReactMarkdown components={muiComponents} remarkPlugins={[remarkGfm]}>
                  {module.content}
                </ReactMarkdown>
              </Box>
            </Box>
          ))}
          
          <Box sx={{ textAlign: 'center', py: 10, borderTop: '1px solid #eee' }}>
            <Typography sx={{ color: '#aaa !important', fontSize: '0.8rem' }}>Material Oficial - {course.title} - Gerado em {new Date().toLocaleDateString()}</Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default Course;