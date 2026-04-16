import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../../../client';
import { 
  Grid, Card, CardContent, CardMedia, Typography, 
  Button, Box, Container, Pagination, TextField, InputAdornment, 
  CircularProgress, Chip, Stack, Divider, IconButton
} from '@mui/material';

// Ícones
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const COURSES_PER_PAGE = 6;

export default function ExploreCourses() {
  const navigate = useNavigate();
  
  // Estados
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [inputValue, setInputValue] = React.useState(''); // Valor do input (temporário)
  const [searchQuery, setSearchQuery] = React.useState(''); // Valor que dispara a busca

  const fetchExploreCourses = React.useCallback(async () => {
    setLoading(true);
    try {
      const start = (page - 1) * COURSES_PER_PAGE;
      const end = start + COURSES_PER_PAGE;

      // Filtro GROQ baseado na confirmação da busca
      const filter = `_type == "course" ${searchQuery ? `&& title match "*${searchQuery}*"` : ''}`;
      
      const query = `{
        "items": *[${filter}] | order(_createdAt desc) [${start}...${end}] {
          _id,
          title,
          description,
          level,
          "slug": slug.current,
          "imageUrl": thumbnail.asset->url,
          "authorName": author->name
        },
        "total": count(*[${filter}])
      }`;

      const { items, total } = await client.fetch(query);
      setCourses(items || []);
      setTotal(total || 0);
    } catch (err) {
      console.error("Erro ao explorar cursos:", err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  React.useEffect(() => {
    fetchExploreCourses();
  }, [fetchExploreCourses]);

  // Função para disparar a busca
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1); // Reseta para a primeira página ao buscar
    setSearchQuery(inputValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* HEADER */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <AutoAwesomeIcon color="primary" sx={{ fontSize: 20 }} />
          <Typography variant="overline" fontWeight="bold" color="primary" sx={{ letterSpacing: 2 }}>
            Biblioteca Global de IA
          </Typography>
        </Stack>
        <Typography variant="h3" fontWeight="900" gutterBottom>
          Explorar Conhecimento
        </Typography>
        
        {/* BARRA DE BUSCA FORMULÁRIO */}
        <Box 
          component="form" 
          onSubmit={handleSearchSubmit} 
          sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="O que você deseja aprender hoje?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MenuBookIcon color="disabled" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" color="primary" edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 4, bgcolor: 'background.paper', pr: 1 }
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 6 }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={40} />
        </Box>
      ) : courses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <SchoolIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Nenhum curso encontrado para "{searchQuery}".
          </Typography>
          <Button sx={{ mt: 2 }} onClick={() => { setInputValue(''); setSearchQuery(''); }}>
            Ver todos os cursos
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={4}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    borderRadius: 4, 
                    display: 'flex', 
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }
                  }}
                >
                  {/* CAPA DO CURSO: Imagem ou Ícone */}
                  {course.imageUrl ? (
                    <CardMedia
                      component="img"
                      height="180"
                      image={course.imageUrl}
                      alt={course.title}
                    />
                  ) : (
                    <Box sx={{ 
                      height: 180, 
                      bgcolor: 'action.hover', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 1,
                      color: 'text.disabled',
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <SchoolIcon sx={{ fontSize: 50, opacity: 0.5 }} />
                      <Typography variant="caption" fontWeight="bold">CURSO IA</Typography>
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip 
                        label={course.level || 'Iniciante'} 
                        size="small" 
                        color="primary" 
                        variant="soft"
                        sx={{ fontWeight: 'bold', borderRadius: 1 }}
                      />
                    </Stack>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ height: 50, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {course.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Estruturado por <strong>{course.authorName || 'Professor IA'}</strong>
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {course.description}
                    </Typography>
                  </CardContent>
                  
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      size="large"
                      onClick={() => navigate(`/curso/${course.slug}`)}
                      sx={{ borderRadius: 2, fontWeight: 'bold' }}
                    >
                      Acessar Curso
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* PAGINAÇÃO */}
          {total > COURSES_PER_PAGE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
              <Pagination 
                count={Math.ceil(total / COURSES_PER_PAGE)} 
                page={page} 
                onChange={(_, value) => {
                  setPage(value);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                color="primary" 
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}