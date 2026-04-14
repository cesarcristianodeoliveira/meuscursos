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

export default function MyCourses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCourses = async () => {
      if (!user?._id) return;
      
      try {
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
        setCourses(data);
      } catch (error) {
        console.error("Erro ao carregar seus cursos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

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

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((n) => (
            <Grid item xs={12} sm={6} md={4} key={n}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
              <Skeleton sx={{ mt: 2 }} width="80%" />
              <Skeleton width="40%" />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }
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
                    <Chip label={course.level} size="small" color="primary" variant="soft" />
                    <Chip label={`${course.xpReward} XP`} size="small" variant="outlined" />
                  </Stack>
                  <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxDirection: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {course.description}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    endIcon={<PlayCircleOutlineIcon />}
                    onClick={() => navigate(`/curso/${course.slug}`)}
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