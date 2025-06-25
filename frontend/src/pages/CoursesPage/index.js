import React, { useEffect, useState } from 'react';
import {
  Typography,
  Container,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Button // Importar Button
} from '@mui/material';
import CourseCard from './components/CourseCard';
import client from '../../sanity';
import { Link } from 'react-router-dom'; // Importar Link para o botão de navegação

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query GROQ para buscar todos os cursos
        // Adicionamos a busca da imagem e slug para o CourseCard
        const query = `*[_type == "course"]{
          _id,
          title,
          "slug": slug.current,
          description,
          image {
            asset->{
              _id,
              url
            }
          },
          level,
          estimatedDuration,
          price,
          isProContent,
          status
        }`;
        const data = await client.fetch(query);
        setCourses(data);
      } catch (err) {
        console.error("Erro ao buscar cursos:", err);
        setError("Não foi possível carregar os cursos. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" lineHeight={1}>
          Cursos
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/cursos/criar" // Link para a nova página de criação de curso
        >
          Criar
        </Button>
      </Box>

      {courses.length === 0 ? (
        <Alert severity="info">Nenhum curso encontrado.</Alert>
      ) : (
        <Grid container spacing={2}>
          {courses.map((course) => (
            <Grid key={course._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <CourseCard course={course} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default CoursesPage;