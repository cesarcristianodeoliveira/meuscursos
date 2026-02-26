import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { client, urlFor } from '../client';
import { 
  Container, Typography, TextField, Button, Card, 
  CardContent, CardActions, Grid, Box, 
  Divider, CardMedia, Chip 
} from '@mui/material';
import { Book, Category } from '@mui/icons-material';

const Home = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);

  // Puxa do .env (REACT_APP_API_URL) ou usa o padrão local
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchCourses = async () => {
    try {
      const query = '*[_type == "course"] | order(_createdAt desc)';
      const data = await client.fetch(query);
      setCourses(data);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Faz o POST para o endpoint completo
      await axios.post(`${API_BASE_URL}/generate-course`, { topic });
      setTopic('');
      fetchCourses(); 
    } catch (error) {
      console.error("Erro na geração:", error);
      alert('Erro ao gerar curso. Verifique se o backend está ativo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, pb: 4 }}>
      {/* Formulário de Geração */}
      <Box 
        component="form" onSubmit={handleGenerate}
        sx={{ bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: 1, display: 'flex', gap: 2, mb: 5 }}
      >
        <TextField
          fullWidth
          label="O que você deseja aprender hoje?"
          variant="outlined"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
        />
        <Button 
          variant="contained" 
          type="submit"
          disabled={loading || !topic}
          sx={{ height: '56px', minWidth: '160px' }}
        >
          {loading ? 'Gerando...' : 'Gerar'}
        </Button>
      </Box>

      <Divider sx={{ mb: 4 }}>
        <Typography variant="h5" color="textSecondary">Cursos Recentes</Typography>
      </Divider>

      {/* Listagem de Cursos */}
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} key={course._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
              <CardMedia
                component="img"
                height="180"
                image={course.thumbnail ? urlFor(course.thumbnail).url() : "https://via.placeholder.com/400x225?text=Curso+Gerado"}
                alt={course.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ mb: 1 }}>
                  <Chip 
                    label={course.category || "Geral"} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    icon={<Category style={{ fontSize: 14 }} />}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Book color="action" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                    {course.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{
                  display: '-webkit-box', 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden'
                }}>
                  {course.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  component={Link} 
                  to={`/curso/${course.slug?.current}`} 
                  variant="contained" 
                  fullWidth
                >
                  Estudar Agora
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;