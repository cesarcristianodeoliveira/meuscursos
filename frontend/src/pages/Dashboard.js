import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import CategoryTabsSkeleton from '../components/CategoryTabsSkeleton';
import StatsBanner from '../components/StatsBanner';
import CategoryTabs from '../components/CategoryTabs';
import CourseGenerateForm from '../components/CourseGenerateForm'; // Import do novo componente
import { useCourse } from '../contexts/CourseContext'; 
import { 
  Container, Box, Typography, Pagination, Stack, Toolbar, Skeleton, useTheme, useMediaQuery
} from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';

const COURSES_PER_PAGE = 5;

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
      
      const [count, data] = await Promise.all([
        client.fetch(`count(${filter})`),
        client.fetch(`${filter} | order(_createdAt desc) [${(page - 1) * COURSES_PER_PAGE}...${page * COURSES_PER_PAGE - 1}]`)
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

  const handleGenerateAction = () => {
    generateCourse(topic, onGenerateSuccess);
  };

  return (
    <>
      <Toolbar />
      
      {/* Seção Superior: Form e Stats */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <CourseGenerateForm 
          topic={topic} 
          setTopic={setTopic} 
          onGenerate={handleGenerateAction} 
          isGenerating={isGenerating} 
        />

        <Box sx={{ mb: 2 }}>
          <StatsBanner stats={stats} fetching={!initialDataLoaded} />
        </Box>
      </Container>

      {/* Navegação Sticky */}
      {!initialDataLoaded ? (
        <CategoryTabsSkeleton />
      ) : (
        <CategoryTabs categories={categories} value={categoryFilter} onChange={handleTabChange} />
      )}

      <div id="tabs-scroll-point" style={{ scrollMarginTop: isMobile ? '104px' : '112px' }} />

      {/* Título e Contador */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Box sx={{ mb: 2, minHeight: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{categoryFilter}</Typography>
          {fetchingCourses ? (
            <Skeleton variant="text" width={80} height={20} sx={{ transform: 'none', mt: 0.5 }} />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {totalCourses} {totalCourses === 1 ? 'curso' : 'cursos'}
            </Typography>
          )}
        </Box>
      </Container>

      {/* Lista de Cursos - Sem Container interno para evitar margens duplas */}
      <Stack spacing={2} sx={{ mb: 4 }}>
        {fetchingCourses ? (
          [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
        ) : (
          <>
            {courses.map((course) => <CourseCard key={course._id} course={course} />)}
            {courses.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <RocketLaunch sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">Nenhum curso encontrado nesta categoria.</Typography>
              </Box>
            )}
          </>
        )}
      </Stack>

      {/* Paginação */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {!fetchingCourses && courses.length !== 0 && totalCourses > COURSES_PER_PAGE && (
          <Stack sx={{ mt: 6, mb: 10, alignItems: 'center' }}>
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

export default Dashboard;