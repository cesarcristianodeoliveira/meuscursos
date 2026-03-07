import React, { useState, useEffect, useCallback } from 'react';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import { useCourse } from '../contexts/CourseContext'; 
import { 
  Container, TextField, Button, Box, Typography, 
  Pagination, Stack, MenuItem,
  Toolbar
} from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';

const COURSES_PER_PAGE = 5;

const Home = () => {
  const [topic, setTopic] = useState('');
  const [fetching, setFetching] = useState(true);
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [categories, setCategories] = useState([]);

  // Puxando o estado global do contexto
  const { isGenerating, generateCourse } = useCourse();

  const fetchCategories = async () => {
    try {
      const data = await client.fetch('*[_type == "course" && defined(category)].category.name');
      const unique = ['Todos', ...new Set(data)];
      setCategories(unique);
    } catch (err) { console.error("Erro categorias:", err); }
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

  // Função disparada ao clicar em Gerar
  const handleGenerate = async (e) => {
    e.preventDefault();
    
    // Chama a função global do contexto
    await generateCourse(topic, () => {
      // Este callback só roda quando o curso termina de ser criado
      setTopic('');
      setPage(1); 
      setCategoryFilter('Todos');
      fetchCourses(); 
      fetchCategories();
    });
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Toolbar />
      <Container maxWidth="xl" sx={{ mt: 2, pb: 4 }}>
        {/* Formulário de Geração */}
        <Box component="form" onSubmit={handleGenerate} sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            label="O que você deseja aprender?"
            variant="outlined"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating} // Desabilita se estiver gerando (globalmente)
            placeholder="Ex: Marketing Digital avançado, Culinária Vegana..."
          />
          <Button 
            variant="contained" 
            type="submit" 
            size="large" 
            disabled={isGenerating || !topic} 
            sx={{ px: 4, minWidth: 120 }}
          >
            {isGenerating ? 'Gerando...' : 'Gerar'}
          </Button>
        </Box>

        {/* Cabeçalho da Listagem */}
        <Stack direction='row' spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h6">Recentes</Typography>
            {!fetching ? (
              <Typography variant="body2" color="text.secondary">
                {totalCourses === 1 ? `${totalCourses} curso disponível` : `${totalCourses} cursos disponíveis`}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Carregando
              </Typography>
            )}
          </Box>
          
          <TextField
            select
            label="Categoria"
            size="small"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            sx={{ minWidth: 128 }}
          >
            {categories.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </TextField>
        </Stack>

        {/* Grid de Cursos ou Skeletons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fetching ? (
            [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
          ) : (
            <>
              {courses.map((course) => <CourseCard key={course._id} course={course} />)}
              {courses.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed', borderColor: 'divider', borderRadius: 4 }}>
                  <RocketLaunch sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Nenhum curso encontrado.</Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Paginação */}
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