import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import CategoryTabsSkeleton from '../components/CategoryTabsSkeleton';
import StatsBanner from '../components/StatsBanner';
import CategoryTabs from '../components/CategoryTabs';
import Hero from '../components/Hero';
import { useCourse } from '../contexts/CourseContext'; 
import { useAuth } from '../contexts/AuthContext'; 
import { 
  Container, Box, Typography, Pagination, Stack, useTheme, useMediaQuery
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';

const COURSES_PER_PAGE = 6;

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { user, refreshUser, loading: authLoading } = useAuth(); 

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

  // 1. Carrega dados globais iniciais (estatísticas e categorias)
  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  // 2. Busca lista de cursos com paginação e filtro
  const fetchCoursesList = useCallback(async () => {
    setFetchingCourses(true);
    try {
      let conditions = ['_type == "course"'];
      
      // Filtro por categoria (se não for "Recentes")
      if (categoryFilter !== 'Recentes') {
        conditions.push(`category.name == "${categoryFilter}"`);
      }
      
      const filter = `*[${conditions.join(' && ')}]`;
      
      // Query otimizada para buscar total e itens paginados
      const query = `{
        "total": count(${filter}),
        "items": ${filter} | order(_createdAt desc) [${(page - 1) * COURSES_PER_PAGE}...${page * COURSES_PER_PAGE - 1}]
      }`;

      const result = await client.fetch(query);
      setTotalCourses(result.total || 0);
      setCourses(result.items || []);
    } catch (err) {
      console.error("Erro ao buscar cursos no Sanity:", err);
      setCourses([]); 
    } finally {
      setFetchingCourses(false);
    }
  }, [page, categoryFilter]);

  // Executa a busca sempre que a página ou filtro mudarem
  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  // Função para scroll suave até a seção de cursos
  const scrollToTabs = useCallback(() => {
    const anchor = document.querySelector('#tabs-scroll-point');
    if (anchor) {
      const offset = isMobile ? 70 : 90; 
      const elementPosition = anchor.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [isMobile]);

  const handlePageChange = (event, value) => {
    setPage(value);
    scrollToTabs();
  };

  const handleTabChange = (event, newValue) => {
    setCategoryFilter(newValue);
    setPage(1); // Reseta para a primeira página ao filtrar
    scrollToTabs();
  };

  // Callback disparado quando a geração do curso termina com sucesso
  const onGenerateSuccess = useCallback(async (slug) => {
    setTopic('');
    
    // Atualiza dados do usuário (XP, créditos)
    if (refreshUser) await refreshUser(); 
    
    // Força atualização da lista de cursos e estatísticas globais
    await fetchGlobalData(true);
    await fetchCoursesList();
    
    // Redireciona para o curso recém-criado
    setTimeout(() => {
      navigate(`/curso/${slug}`);
    }, 800);
  }, [navigate, refreshUser, fetchGlobalData, fetchCoursesList]);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    generateCourse(topic, user?._id, onGenerateSuccess);
  };

  return (
    <>
      <Hero 
        topic={topic} 
        setTopic={setTopic} 
        onGenerate={handleGenerate} 
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <StatsBanner 
          stats={stats} 
          user={user} 
          fetching={authLoading || !initialDataLoaded} 
        />
      </Container>

      {/* Ponto de ancoragem para scroll */}
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
            // Exibe 3 skeletons enquanto carrega
            [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
          ) : (
            <>
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
              
              {/* Empty State */}
              {courses.length === 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexDirection: 'column', 
                  py: 10,
                  textAlign: 'center'
                }}>
                  <MenuBook color='action' sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                  <Typography variant='h6' color='text.secondary'>
                    Nenhum curso encontrado.
                  </Typography>
                  <Typography variant='body2' color='text.disabled'>
                    Tente mudar a categoria ou gere um novo curso no topo.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Stack>

        {/* Paginação */}
        {!fetchingCourses && totalCourses > COURSES_PER_PAGE && (
          <Stack sx={{ pb: 10, alignItems: 'center' }}>
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