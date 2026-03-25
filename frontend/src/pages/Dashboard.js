import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import CategoryTabsSkeleton from '../components/CategoryTabsSkeleton';
import StatsBanner from '../components/StatsBanner';
import CategoryTabs from '../components/CategoryTabs';
import Hero from '../components/Hero';
import { useCourse } from '../contexts/CourseContext'; 
import { 
  Container, Box, Typography, Pagination, Stack, useTheme, useMediaQuery
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';

const COURSES_PER_PAGE = 6;

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
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

  // 1. Carrega Stats e Categorias apenas uma vez (no mount)
  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  // 2. Busca de Cursos (Refatorada para o novo Schema de Categoria)
  const fetchCoursesList = useCallback(async () => {
    setFetchingCourses(true);
    try {
      // Ajuste na Query: category.name agora é o que filtramos
      let conditions = ['_type == "course"'];
      if (categoryFilter !== 'Recentes') {
        conditions.push(`category.name == "${categoryFilter}"`);
      }
      const filter = `*[${conditions.join(' && ')}]`;
      
      // Busca otimizada: Contagem e Dados em paralelo via GROQ
      const query = `{
        "total": count(${filter}),
        "items": ${filter} | order(_createdAt desc) [${(page - 1) * COURSES_PER_PAGE}...${page * COURSES_PER_PAGE - 1}]
      }`;

      const result = await client.fetch(query);

      setTotalCourses(result.total);
      setCourses(result.items || []);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
      setCourses([]); 
    } finally {
      setFetchingCourses(false);
    }
  }, [page, categoryFilter]);

  // 3. Gatilho de Sincronização
  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList, initialDataLoaded]);

  // 4. Scroll Suave Otimizado
  const scrollToTabs = useCallback(() => {
    const anchor = document.querySelector('#tabs-scroll-point');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handlePageChange = (event, value) => {
    setPage(value);
    scrollToTabs();
  };

  const handleTabChange = (event, newValue) => {
    setCategoryFilter(newValue);
    setPage(1);
    scrollToTabs();
  };

  const onGenerateSuccess = useCallback(() => {
    setTopic('');
    setPage(1); // Volta para a página 1 para ver o novo curso
    setCategoryFilter('Recentes'); // Limpa filtro para garantir que o novo apareça
  }, []);

  return (
    <Box sx={{ pb: 10 }}>
      {/* Hero mantendo seu layout original e recebendo as props de estado */}
      <Hero 
        topic={topic} 
        setTopic={setTopic} 
        onGenerate={() => generateCourse(topic, onGenerateSuccess)} 
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        {/* Banner de estatísticas que você criou */}
        <StatsBanner stats={stats} fetching={!initialDataLoaded} />
      </Container>

      <Box sx={{ mt: 4 }}>
        {!initialDataLoaded ? (
          <CategoryTabsSkeleton />
        ) : (
          <CategoryTabs 
            categories={categories} 
            value={categoryFilter} 
            onChange={handleTabChange} 
          />
        )}
      </Box>

      {/* Ponto de ancoragem para o scroll ao mudar de página/categoria */}
      <div id="tabs-scroll-point" style={{ position: 'relative', top: isMobile ? '-80px' : '-100px' }} />

      <Container maxWidth="xl">
        <Stack spacing={3} sx={{ mt: 3 }}>
          {fetchingCourses ? (
            [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
          ) : (
            <>
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
              
              {courses.length === 0 && (
                <Box sx={{ textAlign: 'center', opacity: 0.75, py: 8 }}>
                  <MenuBook sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h6">
                    Nenhum curso encontrado.
                  </Typography>
                  <Typography variant="body2">
                    Seja o primeiro a criar!
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Stack>

        {!fetchingCourses && totalCourses > COURSES_PER_PAGE && (
          <Stack sx={{ mt: 6, alignItems: 'center' }}>
            <Pagination 
              count={Math.ceil(totalCourses / COURSES_PER_PAGE)} 
              page={page} 
              onChange={handlePageChange} 
              color="primary"
              variant="outlined"
              shape="rounded"
              size={isMobile ? "medium" : "large"}
            />
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;