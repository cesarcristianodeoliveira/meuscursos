import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import CategoryTabsSkeleton from '../components/CategoryTabsSkeleton';
import StatsBanner from '../components/StatsBanner';
import CategoryTabs from '../components/CategoryTabs';
import Hero from '../components/Hero';
import { useCourse, COURSES_PER_PAGE } from '../contexts/CourseContext'; 
import { useAuth } from '../contexts/AuthContext'; 
import { 
  Container, Box, Typography, Pagination, Stack, useTheme, useMediaQuery
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';

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

  /**
   * 1. Carrega estatísticas globais ao montar
   */
  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  /**
   * 2. Busca lista de cursos com paginação e filtro de categoria
   */
  const fetchCoursesList = useCallback(async () => {
    setFetchingCourses(true);
    try {
      let filterConditions = ['_type == "course"'];
      
      if (categoryFilter !== 'Recentes') {
        filterConditions.push(`category.name == "${categoryFilter}"`);
      }
      
      const filter = `*[${filterConditions.join(' && ')}]`;
      
      // Query que traz o total de itens para paginação e os cursos da página atual
      const query = `{
        "total": count(${filter}),
        "items": ${filter} | order(_createdAt desc) [${(page - 1) * COURSES_PER_PAGE}...${page * COURSES_PER_PAGE - 1}] {
          ...,
          "authorName": author->name,
          "thumbnailUrl": thumbnail.asset->url
        }
      }`;

      const result = await client.fetch(query);
      setTotalCourses(result.total || 0);
      setCourses(result.items || []);
    } catch (err) {
      console.error("❌ Erro Dashboard (fetchCoursesList):", err);
      setCourses([]); 
    } finally {
      setFetchingCourses(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  /**
   * 3. UX: Scroll suave para a lista de cursos
   */
  const scrollToTabs = useCallback(() => {
    const anchor = document.querySelector('#tabs-scroll-point');
    if (anchor) {
      const navHeight = isMobile ? 64 : 80; 
      const elementPosition = anchor.getBoundingClientRect().top + window.pageYOffset;
      
      window.scrollTo({
        top: elementPosition - navHeight,
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
    setPage(1); 
    // Pequeno delay para o scroll não conflitar com a renderização
    setTimeout(scrollToTabs, 50);
  };

  /**
   * 4. Ação do Professor IA: Gera o curso e orquestra as atualizações
   */
  const onGenerateSuccess = useCallback(async (slug) => {
    setTopic('');
    
    // Atualiza XP e créditos do usuário imediatamente
    if (refreshUser) await refreshUser(); 
    
    // Atualiza a lista de cursos para o novo curso aparecer no topo
    await fetchGlobalData(true);
    await fetchCoursesList();
    
    // Redireciona para o curso após um breve feedback visual
    setTimeout(() => {
      navigate(`/curso/${slug}`);
    }, 1200);
  }, [navigate, refreshUser, fetchGlobalData, fetchCoursesList]);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    // O generateCourse vem do Context e já lida com o progresso/SSE
    generateCourse(topic, user?._id, onGenerateSuccess);
  };

  return (
    <>
      {/* Hero: Entrada do Tópico e Trigger da IA */}
      <Hero 
        topic={topic} 
        setTopic={setTopic} 
        onGenerate={handleGenerate} 
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        {/* Banner de Estatísticas: Mostra XP, Cursos Totais e Créditos */}
        <StatsBanner 
          stats={stats} 
          user={user} 
          fetching={authLoading || !initialDataLoaded} 
        />
      </Container>

      {/* Navegação por Categorias */}
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
              
              {/* Fallback caso não existam cursos */}
              {courses.length === 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexDirection: 'column', 
                  py: 12,
                  textAlign: 'center'
                }}>
                  <MenuBook sx={{ fontSize: 60, mb: 2, opacity: 0.2, color: 'text.primary' }} />
                  <Typography variant='h6' color='text.secondary'>
                    A biblioteca está esperando por você.
                  </Typography>
                  <Typography variant='body2' color='text.disabled'>
                    Gere um curso acima ou explore outras categorias.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Stack>

        {/* Paginação Inteligente */}
        {!fetchingCourses && totalCourses > COURSES_PER_PAGE && (
          <Stack sx={{ pb: 10, alignItems: 'center' }}>
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
    </>
  );
};

export default Dashboard;