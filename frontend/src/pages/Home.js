import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { client, urlFor } from '../client';
import { 
  Container, Typography, TextField, Button, Card, 
  CardContent, Grid, Box, 
  CardMedia, 
  CardActionArea
} from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';

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
    <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
      {/* Formulário de Geração */}
      <Box 
        component="form" onSubmit={handleGenerate}
        sx={{ display: 'flex', gap: 2, mb: 4 }}
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
          size='large'
          disabled={loading || !topic}
        >
          {loading ? 'Gerando' : 'Gerar'}
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" lineHeight={1}>Cursos Recentes</Typography>
      </Box>

      {/* Listagem de Cursos */}
      <Grid container spacing={2}>
        {courses.map((course) => (
          <Grid 
            size={{ 
              xs: 12, 
              sm: 6 
            }} 
            key={course._id}
          >
            <Card>
              <CardActionArea component={Link} to={`/curso/${course.slug?.current}`}>
                {!course.thumbnail ? (
                  <>
                    <Box
                      sx={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        height: 128
                      }}
                    >
                      <RocketLaunch sx={{ width: 32, height: 32, color: 'text.secondary' }} />
                    </Box>
                  </>
                ) : (
                  <CardMedia
                    component="img"
                    height={128}
                    image={course.thumbnail 
                      ? urlFor(course.thumbnail).url() 
                      : null
                    }
                    alt={course.title}
                    sx={{
                      objectFit: 'cover'
                    }}
                  />
                )}
                
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
                    <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                      {course.category}
                    </Typography>
                    <Typography variant="h6">
                      {course.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" 
                    sx={{
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden'
                    }}
                  >
                    {course.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;