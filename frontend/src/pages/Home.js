import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import CategoryTabs from '../components/CategoryTabs';
import { useCourse } from '../contexts/CourseContext'; 
import { 
  Container, TextField, Button, Box, Typography, 
  Pagination, Stack, Toolbar, Skeleton, useTheme
} from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';

const COURSES_PER_PAGE = 5;

const Home = () => {
  const theme = useTheme();
  const [topic, setTopic] = useState('');
  const [fetching, setFetching] = useState(true);
  const [fetchingCategories, setFetchingCategories] = useState(true); 
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [categories, setCategories] = useState([]);

  const { isGenerating, generateCourse } = useCourse();

  const fetchCategories = async () => {
    setFetchingCategories(true);
    try {
      const data = await client.fetch('*[_type == "course" && defined(category)].category.name');
      const unique = [...new Set(data)];
      const sorted = unique.sort((a, b) => a.localeCompare(b));
      setCategories(['Todos', ...sorted]);
    } catch (err) { 
      console.error("Erro categorias:", err); 
    } finally {
      setFetchingCategories(false);
    }
  };

  const fetchCourses = useCallback(async () => {
    setFetching(true);
    try {
      let conditions = ['_type == "course"'];
      if (categoryFilter !== 'Todos') {
        conditions.push(`category.name == "${categoryFilter}"`);
      }
      const filter = `*[${conditions.join(' && ')}]`;
      const total = await client.fetch(`count(${filter})`);
      setTotalCourses(total);

      const start = (page - 1) * COURSES_PER_PAGE;
      const end = start + COURSES_PER_PAGE;
      const data = await client.fetch(`${filter} | order(_createdAt desc) [${start}...${end}]`);
      setCourses(data || []);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
      setCourses([]); 
    } finally { setFetching(false); }
  }, [page, categoryFilter]);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    await generateCourse(topic, () => {
      setTopic('');
      setPage(1); 
      setCategoryFilter('Todos');
      fetchCourses(); 
      fetchCategories();
    });
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    document.getElementById('back-to-top-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTabChange = (event, newValue) => {
    setCategoryFilter(newValue);
    setPage(1);
    document.getElementById('back-to-top-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Toolbar />
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Box component="form" onSubmit={handleGenerate} sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            label="O que você deseja aprender?"
            variant="outlined"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
            placeholder="Ex: Marketing Digital avançado, Culinária Vegana..."
          />
          <Button 
            variant="contained" 
            type="submit" 
            size="large" 
            disabled={isGenerating || !topic} 
            sx={{ px: 4 }}
          >
            {isGenerating ? 'Gerando...' : 'Gerar'}
          </Button>
        </Box>
      </Container>

      {/* Renderização condicional do Skeleton das Tabs */}
      {fetchingCategories ? (
        <Box sx={{ 
          position: 'sticky', top: 0, zIndex: 1000, width: '100%', minHeight: 48,
          bgcolor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.75)' : 'hsla(204, 14%, 7%, 0.75)',
          backdropFilter: 'blur(8px)', borderBottom: 1, borderColor: 'divider'
        }}>
          <Container maxWidth="xl">
            <Stack direction="row" spacing={4} sx={{ py: 1.5 }}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="text" width={80} height={24} sx={{ borderRadius: 1 }} />
              ))}
            </Stack>
          </Container>
        </Box>
      ) : (
        <CategoryTabs 
          categories={categories} 
          value={categoryFilter} 
          onChange={handleTabChange} 
        />
      )}

      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {/* Título da Categoria - Fora do fetching para não piscar */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {categoryFilter === 'Todos' ? 'Recentes' : categoryFilter}
          </Typography>

          {/* Apenas a contagem de cursos mostra o Skeleton durante o fetch */}
          {fetching ? (
            <Skeleton variant="text" width="150px" height={20} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {totalCourses === 1 
                ? `${totalCourses} curso disponível` 
                : `${totalCourses} cursos disponíveis`}
            </Typography>
          )}
        </Box>
      </Container>
      
      {/* Listagem de Cursos */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {fetching ? (
          [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
        ) : (
          <>
            {courses.map((course) => <CourseCard key={course._id} course={course} />)}
            {courses.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed', borderColor: 'divider', borderRadius: 4, mx: 2 }}>
                <RocketLaunch sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhum curso encontrado nesta categoria.</Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Paginação */}
      <Container maxWidth="xl" sx={{ mt: 2, pb: 10 }}>
        {!fetching && totalCourses > COURSES_PER_PAGE && (
          <Stack sx={{ mt: 6, alignItems: 'center' }}>
            <Pagination 
              count={Math.ceil(totalCourses / COURSES_PER_PAGE)} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Stack>
        )}
      </Container>
    </>
  );
};

export default Home;