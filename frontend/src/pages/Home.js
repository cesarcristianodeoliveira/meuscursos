import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import { 
  Container, TextField, Button, Box, Typography, 
  Pagination, Stack, MenuItem
} from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';

const COURSES_PER_PAGE = 5;

const Home = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [page, setPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [categories, setCategories] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchCategories = async () => {
    try {
      // Busca apenas categorias que não estão vazias
      const data = await client.fetch('*[_type == "course" && defined(category)].category');
      const unique = ['Todos', ...new Set(data)];
      setCategories(unique);
    } catch (err) {
      console.error("Erro categorias:", err);
    }
  };

  const fetchCourses = useCallback(async () => {
    setFetching(true);
    try {
      // Construção da Query Base
      let conditions = ['_type == "course"'];
      
      if (categoryFilter !== 'Todos') {
        conditions.push(`category == "${categoryFilter}"`);
      }
      
      if (searchTerm) {
        // O match no Sanity já busca por termos. Usamos lower para facilitar.
        conditions.push(`title match "${searchTerm}*"`);
      }

      const filter = `*[${conditions.join(' && ')}]`;

      // 1. Total de itens para paginação
      const total = await client.fetch(`count(${filter})`);
      setTotalCourses(total);

      // 2. Busca paginada
      const start = (page - 1) * COURSES_PER_PAGE;
      const end = start + COURSES_PER_PAGE;
      const query = `${filter} | order(_createdAt desc) [${start}...${end}]`;
      
      const data = await client.fetch(query);
      setCourses(data || []);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
      setCourses([]); 
    } finally {
      setFetching(false);
    }
  }, [page, categoryFilter, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, []); // Só busca as categorias ao montar o componente ou após gerar curso

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/generate-course`, { topic });
      setTopic('');
      // Resetar filtros para ver o novo curso
      setPage(1); 
      setSearchTerm('');
      setCategoryFilter('Todos');
      
      // Atualizar dados
      await fetchCourses(); 
      await fetchCategories();
    } catch (error) {
      console.error("Erro na geração:", error);
      alert('Erro ao gerar curso.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
      <Box component="form" onSubmit={handleGenerate} sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          label="O que você deseja aprender agora?"
          variant="outlined"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
        />
        <Button variant="contained" type="submit" size="large" disabled={loading || !topic}>
          {loading ? 'Gerando...' : 'Gerar'}
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" fontWeight="500">Cursos Recentes</Typography>
        {!fetching && (
          <Typography variant="body2" color="text.secondary">
            Mostrando {courses.length} de {totalCourses} {totalCourses === 1 ? 'curso' : 'cursos'}
          </Typography>
        )}
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <TextField
          label="Pesquisar"
          size="small"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
        <TextField
          select
          label="Categoria"
          size="small"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          fullWidth
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {(fetching || loading) ? (
          [...Array(COURSES_PER_PAGE)].map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))
        ) : (
          <>
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}

            {courses.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <RocketLaunch sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">Nenhum curso encontrado</Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {!fetching && totalCourses > COURSES_PER_PAGE && (
        <Stack spacing={2} sx={{ mt: 4, alignItems: 'center' }}>
          <Pagination 
            count={Math.ceil(totalCourses / COURSES_PER_PAGE)} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            shape="rounded"
          />
        </Stack>
      )}
    </Container>
  );
};

export default Home;