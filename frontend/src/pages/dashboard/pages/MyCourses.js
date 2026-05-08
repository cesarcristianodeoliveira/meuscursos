import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../../../client';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Grid, Card, CardContent, CardMedia, Typography, 
  Button, Box, Skeleton, Chip, Stack, Container 
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';

export default function MyCourses() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth(); 
  const [courses, setCourses] = React.useState([]);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    const fetchCourses = async () => {
      // 1. Espera o carregamento do Auth terminar
      if (authLoading) return;

      // 2. Se não houver usuário logado, para a busca
      if (!user?._id) {
        setFetching(false);
        return;
      }
      
      try {
        setFetching(true);
        /**
         * FILTRO DE SEGURANÇA:
         * Buscamos cursos onde author._ref é igual ao _id do usuário logado.
         */
        const query = `*[_type == "course" && author._ref == $userId] | order(_createdAt desc) {
          _id,
          title,
          description,
          level,
          xpReward,
          "slug": slug.current,
          "imageUrl": thumbnail.asset->url
        }`;
        
        const data = await client.fetch(query, { userId: user._id });
        setCourses(data || []);
      } catch (error) {
        console.error("Erro ao carregar seus cursos:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchCourses();
  }, [user?._id, authLoading]); // Dependência específica no _id

  const isLoading = authLoading || fetching;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Meus Cursos</Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie e continue seus estudos gerados por IA.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/dashboard/gerar')}
        >
          Novo Curso
        </Button>
      </Stack>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((n) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={n}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
              <Box sx={{ pt: 1 }}>
                <Skeleton width="60%" />
                <Skeleton />
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : courses.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center', 
            mt: 8, 
            p: 5, 
            border: '2px dashed', 
            borderColor: 'divider', 
            borderRadius: 4 
          }}
        >
          <SchoolIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum curso encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Parece que você ainda não gerou cursos.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard/gerar')}
          >
            Gerar meu primeiro curso
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: '0.3s',
                  '&:hover': { 
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)' 
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="160"
                  image={course.imageUrl || 'https://via.placeholder.com/400x200?text=Curso+IA'}
                  alt={course.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                    <Chip 
                      label={course.level || 'Geral'} 
                      size="small" 
                      color="primary" 
                    />
                    <Chip 
                      label={`${course.xpReward || 0} XP`} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Stack>
                  <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom sx={{ fontSize: '1.1rem' }}>
                    {course.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {course.description}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    endIcon={<PlayCircleOutlineIcon />}
                    onClick={() => navigate(`/dashboard/curso/${course.slug}`)}
                    sx={{ borderRadius: 2 }}
                  >
                    Estudar Agora
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}