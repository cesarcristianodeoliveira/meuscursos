import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// IMPORTANTE: Este é o caminho correto para o seu Sanity Client no frontend
import client from '../../sanity';

function CoursePage() {
  const { courseSlug } = useParams(); // Pega o slug do curso da URL
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseSlug) {
      setError('Nenhum slug de curso fornecido na URL.');
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query GROQ para buscar o curso pelo slug
        // e também as lições relacionadas, ordenadas por 'order'
        const query = `*[_type == "course" && slug.current == $courseSlug][0]{
          _id,
          title,
          description,
          slug,
          price,
          level,
          estimatedDuration,
          "lessons": lessons[]->{
            _id,
            title,
            slug,
            order,
            estimatedReadingTime
          }|order(order asc), // Garante que as lições venham ordenadas
          creator->{
            _id,
            name
          }
        }`;
        
        const data = await client.fetch(query, { courseSlug });
        
        if (data) {
          setCourse(data);
        } else {
          setError(`Curso com slug "${courseSlug}" não encontrado.`);
        }
      } catch (err) {
        console.error("Erro ao buscar curso do Sanity:", err);
        setError('Erro ao carregar os detalhes do curso. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseSlug]); // Re-executa o efeito se o courseSlug mudar

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button component={RouterLink} to="/cursos" startIcon={<ChevronLeftIcon />} variant="outlined">
            Voltar para a Lista de Cursos
          </Button>
        </Box>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">Nenhum curso encontrado.</Typography>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button component={RouterLink} to="/cursos" startIcon={<ChevronLeftIcon />} variant="outlined">
            Voltar para a Lista de Cursos
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          component={RouterLink}
          to="/cursos"
          startIcon={<ChevronLeftIcon />}
          variant="outlined"
        >
          Voltar para a Lista de Cursos
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        {course.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ textAlign: 'center', mb: 4 }}>
        {course.description}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.primary">
          **Nível:** {course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : 'Não Definido'}
        </Typography>
        <Typography variant="body2" color="text.primary">
          **Duração Estimada:** {course.estimatedDuration || 'Não Definido'}
        </Typography>
        <Typography variant="body2" color="text.primary">
          **Preço:** {course.price === 0 ? 'Gratuito' : `R$ ${course.price},00`}
        </Typography>
        <Typography variant="body2" color="text.primary">
          **Criador:** {course.creator ? course.creator.name : 'N/A'}
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Lições do Curso
      </Typography>
      <List>
        {course.lessons && course.lessons.length > 0 ? (
          course.lessons.map((lesson, index) => (
            <React.Fragment key={lesson._id}>
              <ListItem
                button
                component={RouterLink}
                to={`/cursos/${course.slug.current}/aula/${lesson.slug.current}`}
                sx={{ py: 1.5 }}
              >
                <ListItemText
                  primary={<Typography variant="h6">{lesson.order}. {lesson.title}</Typography>}
                  secondary={`Tempo de Leitura: ${lesson.estimatedReadingTime || 5} min`}
                />
              </ListItem>
              {index < course.lessons.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="Nenhuma lição encontrada para este curso." />
          </ListItem>
        )}
      </List>
    </Container>
  );
}

export default CoursePage;