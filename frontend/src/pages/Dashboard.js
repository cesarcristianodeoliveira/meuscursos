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
  Container, Box, Typography, Pagination, Stack, Toolbar, Skeleton, useTheme, useMediaQuery
} from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';

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

  // 1. Carrega dados globais (Stats e Categorias)
  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  // 2. Função para buscar a lista de cursos (Memorizada para evitar loops)
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

  // Executa a busca sempre que a página ou filtro mudar
  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  // 3. Lógica de Scroll suave
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

  // 4. Handlers de Navegação
  const handlePageChange = (event, value) => {
    setPage(value);
    scrollToTabs();
  };

  const handleTabChange = (event, newValue) => {
    setCategoryFilter(newValue);
    setPage(1);
    scrollToTabs();
  };

  // 5. LOGICA DE PÓS-GERAÇÃO (Ajustada para o Streaming)
  const onGenerateSuccess = useCallback(() => {
    // Aguarda um momento para o usuário ler a mensagem de sucesso e o Sanity indexar
    setTimeout(async () => {
      setTopic('');
      setPage(1); 
      setCategoryFilter('Recentes');
      await fetchCoursesList(); // Atualiza a lista para mostrar o novo curso no topo
    }, 2000); 
  }, [fetchCoursesList]);

  const handleGenerateAction = () => {
    if (!topic.trim()) return;
    generateCourse(topic, onGenerateSuccess);
  };

  return (
    <>
      <Toolbar />
      
      {/* SEÇÃO HERO & GERAÇÃO */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Hero 
          topic={topic} 
          setTopic={setTopic} 
          onGenerate={handleGenerateAction} 
        />

        <Box sx={{ mb: 2 }}>
          <StatsBanner stats={stats} fetching={!initialDataLoaded} />
        </Box>
      </Container>

      {/* NAVEGAÇÃO POR CATEGORIAS */}
      {!initialDataLoaded ? (
        <CategoryTabsSkeleton />
      ) : (
        <CategoryTabs categories={categories} value={categoryFilter} onChange={handleTabChange} />
      )}

      {/* Ponto de ancoragem para o scroll */}
      <div id="tabs-scroll-point" style={{ scrollMarginTop: isMobile ? '104px' : '112px' }} />

      {/* TÍTULO E CONTAGEM */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Box sx={{ mb: 2, minHeight: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
            {categoryFilter}
          </Typography>
          {fetchingCourses ? (
            <Skeleton variant="text" width={80} height={20} sx={{ mt: 0.5 }} />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {totalCourses} {totalCourses === 1 ? 'curso encontrado' : 'cursos encontrados'}
            </Typography>
          )}
        </Box>
      </Container>

      {/* LISTAGEM DE CARDS */}
      <Stack spacing={2} sx={{ mb: 4 }}>
        {fetchingCourses ? (
          [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
        ) : (
          <>
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
            
            {/* Estado Vazio */}
            {courses.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <RocketLaunch sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  Nenhum curso encontrado nesta categoria.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Stack>

      {/* PAGINAÇÃO */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {!fetchingCourses && courses.length !== 0 && totalCourses > COURSES_PER_PAGE && (
          <Stack sx={{ mt: 6, mb: 10, alignItems: 'center' }}>
            <Pagination 
              count={Math.ceil(totalCourses / COURSES_PER_PAGE)} 
              page={page} 
              onChange={handlePageChange} 
              color="primary"
              size={isMobile ? "medium" : "large"}
            />
          </Stack>
        )}
      </Container>
    </>
  );
};

export default Dashboard;