import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../../client'; // Ajustado o path conforme estrutura padrão
import CourseCard from '../../components/CourseCard';
import CourseCardSkeleton from '../../components/CourseCardSkeleton';
import CategoryTabsSkeleton from '../../components/CategoryTabsSkeleton';
import StatsBanner from '../../components/StatsBanner';
import CategoryTabs from '../../components/CategoryTabs';
import Hero from '../../components/Hero';
import { useCourse, COURSES_PER_PAGE } from '../../contexts/CourseContext'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { 
  Toolbar, Container, Box, Typography, Pagination, Stack, useTheme, useMediaQuery
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { user, refreshUser, authLoading } = useAuth(); 

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
   * 2. Busca lista de cursos com paginação e filtro
   */
  const fetchCoursesList = useCallback(async () => {
    setFetchingCourses(true);
    try {
      // Condição base: apenas cursos publicados
      let filterConditions = ['_type == "course"', 'isPublished == true'];
      
      if (categoryFilter !== 'Recentes') {
        // Busca cursos onde a referência da categoria tem o título selecionado
        filterConditions.push(`category->title == "${categoryFilter}"`);
      }
      
      const filter = `*[${filterConditions.join(' && ')}]`;
      
      const query = `{
        "total": count(${filter}),
        "items": ${filter} | order(_createdAt desc) [${(page - 1) * COURSES_PER_PAGE}...${page * COURSES_PER_PAGE - 1}] {
          ...,
          "authorName": author->name,
          "categoryName": category->title,
          "thumbnailUrl": thumbnail.asset->url
        }
      }`;

      const result = await client.fetch(query);
      setTotalCourses(result.total || 0);
      setCourses(result.items || []);
    } catch (err) {
      console.error("❌ Erro Dashboard:", err);
      setCourses([]); 
    } finally {
      setFetchingCourses(false);
    }
  }, [page, categoryFilter]);

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  /**
   * 3. UX: Controle de Navegação e Scroll
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
    setTimeout(scrollToTabs, 50);
  };

  /**
   * 4. Orquestração da IA
   */
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    // Chama a função do Context que já lida com o estado global de loading/status
    const result = await generateCourse(topic);

    if (result.success) {
      setTopic('');
      
      // Sincroniza a lista local e estatísticas antes de navegar
      await fetchCoursesList();
      
      // Feedback visual antes de pular para o curso
      setTimeout(() => {
        navigate(`/curso/${result.slug}`);
      }, 1000);
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Toolbar />
      
      {/* Entrada do Tópico: Hero centralizado no topo do dashboard */}
      <Hero 
        topic={topic} 
        setTopic={setTopic} 
        onGenerate={handleGenerate} 
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        {/* Mostra XP, Cursos Totais e progresso do Usuário */}
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
        <Stack spacing={3} sx={{ mt: 2, mb: 4 }}>
          {fetchingCourses ? (
            [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
          ) : (
            <>
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
              
              {/* Estado Vazio */}
              {courses.length === 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexDirection: 'column', 
                  py: 12,
                  textAlign: 'center',
                  opacity: 0.6
                }}>
                  <MenuBook sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                  <Typography variant='h6' gutterBottom>
                    Nenhum curso encontrado nesta categoria.
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Que tal ser o primeiro a criar um curso sobre isso usando nossa IA?
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Stack>

        {/* Paginação */}
        {!fetchingCourses && totalCourses > COURSES_PER_PAGE && (
          <Stack sx={{ mt: 4, alignItems: 'center' }}>
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