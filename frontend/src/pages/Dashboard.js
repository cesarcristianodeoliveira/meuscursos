import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import StatsBanner from '../components/StatsBanner';
import CategoryTabs from '../components/CategoryTabs';
import { useCourse } from '../contexts/CourseContext'; 
import { 
  Container, TextField, Button, Box, Typography, 
  Pagination, Stack, Toolbar, Skeleton, useTheme
} from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';

const COURSES_PER_PAGE = 5;

const Dashboard = () => {
  const theme = useTheme();
  const [topic, setTopic] = useState('');
  const [fetching, setFetching] = useState(true);
  const [fetchingCategories, setFetchingCategories] = useState(true); 
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('Recentes');
  const [categories, setCategories] = useState([]);

  const { isGenerating, generateCourse } = useCourse();

  const [stats, setStats] = useState({ courses: 0, lessons: 0, quizzes: 0, categories: 0 });
  const [fetchingStats, setFetchingStats] = useState(true);

  // Função centralizada para scroll inteligente até as Tabs
  const scrollToTabs = () => {
    const anchor = document.querySelector('#tabs-scroll-point');
    if (anchor) {
      const offset = 80; // Altura da sua Navbar + um respiro
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = anchor.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  const fetchCategories = async () => {
    setFetchingCategories(true);
    try {
      const data = await client.fetch('*[_type == "course" && defined(category)].category.name');
      const unique = [...new Set(data)];
      const sorted = unique.sort((a, b) => a.localeCompare(b));
      setCategories(['Recentes', ...sorted]);
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
      if (categoryFilter !== 'Recentes') {
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

  const fetchStats = async () => {
    setFetchingStats(true);
    try {
      const query = `{
        "courses": count(*[_type == "course"]),
        "categories": count(array::unique(*[_type == "course"].category.name)),
        "lessons": count(*[_type == "course"].modules[]),
        "quizzes": count(*[_type == "course"].modules[].exercises[])
      }`;
      const data = await client.fetch(query);
      setStats(data);
    } catch (err) {
      console.error("Erro stats:", err);
    } finally {
      setFetchingStats(false);
    }
  };

  useEffect(() => { fetchCategories(); fetchStats(); }, []);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    await generateCourse(topic, () => {
      setTopic('');
      setPage(1); 
      setCategoryFilter('Recentes');
      fetchCourses(); 
      fetchCategories();
      fetchStats(); // Atualiza estatísticas após gerar novo curso
    });
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    scrollToTabs(); // Usa a nova lógica de scroll
  };

  const handleTabChange = (event, newValue) => {
    setCategoryFilter(newValue);
    setPage(1);
    scrollToTabs(); // Usa a nova lógica de scroll
  };

  return (
    <>
      <Toolbar />
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Box component="form" onSubmit={handleGenerate} sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
            sx={{ px: 2, minWidth: 100 }}
          >
            {isGenerating ? 'Gerando' : 'Gerar'}
          </Button>
        </Box>

        <StatsBanner stats={stats} fetching={fetchingStats} />
      </Container>

      {/* Âncora Invisível para o Scroll Inteligente */}
      <div id="tabs-scroll-point" style={{ position: 'relative' }} />

      {/* Renderização condicional do Skeleton das Tabs */}
      {fetchingCategories ? (
        <Box sx={{ 
          position: 'sticky', top: 0, zIndex: 1000, width: '100%', minHeight: 48,
          bgcolor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.75)' : 'hsla(204, 14%, 7%, 0.75)',
          backdropFilter: 'blur(8px)'
        }}>
          <Container maxWidth="xl">
            <Stack direction="row" spacing={4} sx={{ py: 1.5 }}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="text" width={96} height={24} />
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
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">
            {categoryFilter}
          </Typography>

          {fetching ? (
            <Skeleton variant="text" width="64px" height={20} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {totalCourses === 1 
                ? `${totalCourses} curso` 
                : `${totalCourses} cursos`}
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
              <Box sx={{ textAlign: 'center', p: 5 }}>
                <RocketLaunch sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhum curso encontrado nesta categoria.</Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Paginação */}
      {!fetching && courses.length !== 0 && totalCourses > COURSES_PER_PAGE && (
        <Container maxWidth="xl" sx={{ mt: 2, pb: 10 }}>
          <Stack sx={{ mt: 6, alignItems: 'center' }}>
            <Pagination 
              count={Math.ceil(totalCourses / COURSES_PER_PAGE)} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Stack>
        </Container>
      )}
    </>
  );
};

export default Dashboard;