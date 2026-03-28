import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import CategoryTabsSkeleton from '../components/CategoryTabsSkeleton';
import StatsBanner from '../components/StatsBanner';
import CategoryTabs from '../components/CategoryTabs';
import Hero from '../components/Hero';
import { useCourse } from '../contexts/CourseContext'; 
import { useAuth } from '../contexts/AuthContext'; // 1. Importamos o Auth
import { 
  Container, Box, Typography, Pagination, Stack, useTheme, useMediaQuery
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';

const COURSES_PER_PAGE = 6;

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Pegamos o usuário logado e a função de atualizar os dados dele
  const { user, refreshUser } = useAuth(); 

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

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  const fetchCoursesList = useCallback(async () => {
    setFetchingCourses(true);
    try {
      let conditions = ['_type == "course"'];
      if (categoryFilter !== 'Recentes') {
        conditions.push(`category.name == "${categoryFilter}"`);
      }
      const filter = `*[${conditions.join(' && ')}]`;
      
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

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList, initialDataLoaded]);

  const scrollToTabs = useCallback(() => {
    const anchor = document.querySelector('#tabs-scroll-point');
    if (anchor) {
      const offset = isMobile ? 70 : 80; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = anchor.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [isMobile]);

  const handlePageChange = (event, value) => {
    setPage(value);
    if (totalCourses > COURSES_PER_PAGE) {
      scrollToTabs();
    }
  };

  const handleTabChange = (event, newValue) => {
    setCategoryFilter(newValue);
    setPage(1);
    scrollToTabs();
  };

  // 2. Função de sucesso atualizada para resetar créditos na tela
  const onGenerateSuccess = useCallback(() => {
    setTopic('');
    setPage(1);
    setCategoryFilter('Recentes');
    fetchCoursesList(); // Atualiza a lista para o novo curso aparecer
    if (refreshUser) refreshUser(); // Atualiza os créditos do usuário no AuthContext
  }, [fetchCoursesList, refreshUser]);

  return (
    <>
      <Hero 
        topic={topic} 
        setTopic={setTopic} 
        // 3. Passamos o ID do usuário para o gerador
        onGenerate={() => generateCourse(topic, user?._id, onGenerateSuccess)} 
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        {/* Passamos o user para o banner se quisermos exibir créditos lá */}
        <StatsBanner stats={stats} user={user} fetching={!initialDataLoaded} />
      </Container>

      <Box sx={{ mt: 4 }} id="tabs-scroll-point">
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

      <Container maxWidth="xl">
        <Stack spacing={2} sx={{ mt: 2, mb: 4 }}>
          {fetchingCourses ? (
            [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
          ) : (
            <>
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
              
              {courses.length === 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', py: 8 }}>
                  <MenuBook color='action' sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant='subtitle1' color='text.secondary'>
                    Nenhum curso encontrado nesta categoria.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Stack>

        {!fetchingCourses && totalCourses > COURSES_PER_PAGE && (
          <Stack sx={{ pb: 8, alignItems: 'center' }}>
            <Pagination 
              count={Math.ceil(totalCourses / COURSES_PER_PAGE)} 
              page={page} 
              onChange={handlePageChange} 
              color="secondary"
              variant="outlined"
              shape="rounded"
              size={isMobile ? "medium" : "large"}
            />
          </Stack>
        )}
      </Container>
    </>
  );
};

export default Dashboard;