import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import StatsBanner from '../components/StatsBanner';
import CategoryTabs from '../components/CategoryTabs';
import { useCourse } from '../contexts/CourseContext'; 
import { 
  Container, TextField, Button, Box, Typography, 
  Pagination, Stack, Toolbar, Skeleton, useTheme, useMediaQuery
} from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';

const COURSES_PER_PAGE = 5;

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Consumindo dados globais e funções do Contexto
  const { 
    isGenerating, 
    generateCourse, 
    stats, 
    categories, 
    fetchGlobalData, 
    initialDataLoaded 
  } = useCourse();

  const [topic, setTopic] = useState('');
  const [fetchingCourses, setFetchingCourses] = useState(true);
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('Recentes');

  // 1. Efeito para carregar estatísticas e abas (apenas se não estiverem no cache)
  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  // 2. Efeito para buscar a lista de cursos (sempre que mudar página ou filtro)
  const fetchCoursesList = useCallback(async () => {
    setFetchingCourses(true);
    try {
      let conditions = ['_type == "course"'];
      if (categoryFilter !== 'Recentes') {
        conditions.push(`category.name == "${categoryFilter}"`);
      }
      const filter = `*[${conditions.join(' && ')}]`;
      
      // Busca contagem total e dados da página atual em paralelo
      const [count, data] = await Promise.all([
        client.fetch(`count(${filter})`),
        client.fetch(`${filter} | order(_createdAt desc) [${(page - 1) * COURSES_PER_PAGE}...${page * COURSES_PER_PAGE}]`)
      ]);

      setTotalCourses(count);
      setCourses(data || []);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
      setCourses([]); 
    } finally {
      setFetchingCourses(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  // Lógica de Scroll
  const scrollToTabs = useCallback(() => {
    setTimeout(() => {
      const anchor = document.querySelector('#tabs-scroll-point');
      if (anchor) {
        const navHeight = isMobile ? 56 : 64;
        const tabsHeight = 48;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = anchor.getBoundingClientRect().top;
        window.scrollTo({
          top: (elementRect - bodyRect) - (navHeight + tabsHeight), 
          behavior: 'smooth'
        });
      }
    }, 50);
  }, [isMobile]);

  const handlePageChange = (event, value) => {
    setPage(value);
    scrollToTabs();
  };

  const handleTabChange = (event, newValue) => {
    setCategoryFilter(newValue);
    setPage(1);
    scrollToTabs();
  };

  const onGenerateSuccess = () => {
    setTopic('');
    setPage(1); 
    setCategoryFilter('Recentes');
    fetchCoursesList();
  };

  return (
    <>
      <Toolbar />
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); generateCourse(topic, onGenerateSuccess); }} sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="O que você deseja aprender?"
            variant="outlined"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
            placeholder="Ex: Marketing Digital avançado, Culinária Vegana..."
          />
          <Button variant="contained" type="submit" size="large" disabled={isGenerating || !topic} sx={{ px: 2, minWidth: 100 }}>
            {isGenerating ? 'Gerando' : 'Gerar'}
          </Button>
        </Box>

        <StatsBanner stats={stats} fetching={!initialDataLoaded} />
      </Container>

      {/* Renderização condicional baseada no cache global do Contexto */}
      {!initialDataLoaded ? (
        <Box sx={{ 
          position: 'sticky', top: 0, zIndex: 1000, width: '100%', minHeight: 48,
          bgcolor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.75)' : 'hsla(204, 14%, 7%, 0.75)',
          backdropFilter: 'blur(8px)'
        }}>
          <Container maxWidth="xl">
            <Stack direction="row" spacing={4} sx={{ py: 1.5 }}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} variant="text" width={96} height={24} />)}
            </Stack>
          </Container>
        </Box>
      ) : (
        <CategoryTabs categories={categories} value={categoryFilter} onChange={handleTabChange} />
      )}

      <div id="tabs-scroll-point" style={{ scrollMarginTop: isMobile ? '104px' : '112px' }} />

      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">{categoryFilter}</Typography>
          {fetchingCourses ? (
            <Skeleton variant="text" width="64px" height={20} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {totalCourses} {totalCourses === 1 ? 'curso' : 'cursos'}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fetchingCourses ? (
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

        {!fetchingCourses && courses.length !== 0 && totalCourses > COURSES_PER_PAGE && (
          <Container maxWidth="xl" sx={{ mt: 2, pb: 10 }}>
            <Stack sx={{ mt: 6, alignItems: 'center' }}>
              <Pagination count={Math.ceil(totalCourses / COURSES_PER_PAGE)} page={page} onChange={handlePageChange} color="primary" />
            </Stack>
          </Container>
        )}
      </Container>
    </>
  );
};

export default Dashboard;