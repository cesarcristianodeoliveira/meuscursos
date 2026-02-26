import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client } from '../client';
import ReactMarkdown from 'react-markdown'; // Novo import
import { 
  Typography, 
  Box, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Button,
  CircularProgress,
  Divider,
  Container
} from '@mui/material';
import { ExpandMore, ArrowBack, MenuBook } from '@mui/icons-material';

function Course() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = `*[_type == "course" && slug.current == $slug][0]`;
    client.fetch(query, { slug })
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [slug]);

  // Configuração de Estilização do Markdown para Material UI
  const muiComponents = {
    h1: ({ children }) => <Typography variant="h4" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>{children}</Typography>,
    h2: ({ children }) => <Typography variant="h5" sx={{ mt: 3, mb: 1, fontWeight: 'bold', color: '#1976d2' }}>{children}</Typography>,
    h3: ({ children }) => <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>{children}</Typography>,
    p: ({ children }) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, textAlign: 'justify' }}>{children}</Typography>,
    li: ({ children }) => (
      <Box component="li" sx={{ mb: 1, ml: 2 }}>
        <Typography variant="body1">{children}</Typography>
      </Box>
    ),
    ul: ({ children }) => <Box component="ul" sx={{ mb: 2, pl: 2 }}>{children}</Box>,
    ol: ({ children }) => <Box component="ol" sx={{ mb: 2, pl: 2 }}>{children}</Box>,
    strong: ({ children }) => <Box component="strong" sx={{ fontWeight: 'bold', color: '#000' }}>{children}</Box>,
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
    </Box>
  );

  if (!course) return (
    <Container sx={{ mt: 5, textAlign: 'center' }}>
      <Typography variant="h5">Curso não encontrado.</Typography>
      <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Voltar ao Início</Button>
    </Container>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/')} 
        sx={{ mb: 3, textTransform: 'none', fontWeight: 'bold' }}
      >
        Voltar para a lista
      </Button>

      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, mb: 4, borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: 'white' }}>
        <Typography 
          variant="overline" 
          sx={{ fontWeight: 'bold', letterSpacing: 1.2 }}
        >
          {course.category?.toUpperCase() || 'CURSO'}
        </Typography>
        <Typography color='primary' variant="h3" gutterBottom sx={{ fontWeight: 800, mt: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
          {course.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
          {course.description}
        </Typography>
      </Paper>

      <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#333' }}>
        <MenuBook sx={{ mr: 1.5, color: '#1976d2' }} /> Conteúdo do Curso
      </Typography>

      {course.modules?.map((module, index) => (
        <Accordion 
          key={module._key || index} 
          elevation={0}
          sx={{ 
            mb: 2, 
            border: '1px solid #e0e0e0',
            borderRadius: '12px !important', 
            overflow: 'hidden',
            '&:before': { display: 'none' },
            '&.Mui-expanded': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
          }}
        >
          <AccordionSummary expandMoreIcon={<ExpandMore color="primary" />}>
            <Typography sx={{ fontWeight: 700, py: 1 }}>
              {index + 1}. {module.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, md: 4 }, pb: 4, bgcolor: '#fafafa' }}>
            <Divider sx={{ mb: 3 }} />
            <Box>
              {/* RENDERIZADOR DE MARKDOWN */}
              <ReactMarkdown components={muiComponents}>
                {module.content}
              </ReactMarkdown>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Container>
  );
}

export default Course;