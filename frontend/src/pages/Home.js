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

const COURSES_PER_PAGE = 10;

const Home = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [courses, setCourses] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [categories, setCategories] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const fetchCategories = async () => {
    try {
      const data = await client.fetch('*[_type == "course" && defined(category)].category');
      const unique = ['Todos', ...new Set(data)];
      setCategories(unique);
    } catch (err) { console.error("Erro categorias:", err); }
  };

  const fetchCourses = useCallback(async () => {
    setFetching(true);
    try {
      let conditions = ['_type == "course"'];
      if (categoryFilter !== 'Todos') {
        conditions.push(`category == "${categoryFilter}"`);
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

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/generate-course`, { topic });
      setTopic('');
      setPage(1); 
      setCategoryFilter('Todos');
      await fetchCourses(); 
      await fetchCategories();
    } catch (error) {
      alert('Erro ao gerar curso.');
    } finally { setLoading(false); }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
      <Box component="form" onSubmit={handleGenerate} sx={{ display: 'flex', gap: 2, mb: 6 }}>
        <TextField
          fullWidth
          label="O que você deseja aprender hoje?"
          variant="outlined"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
        />
        <Button variant="contained" type="submit" size="large" disabled={loading || !topic} sx={{ px: 4, fontWeight: 'bold' }}>
          {loading ? 'Gerando' : 'Gerar'}
        </Button>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>Cursos Recentes</Typography>
          {!fetching && (
            <Typography variant="body2" color="text.secondary">
              {totalCourses === 1 ? `${totalCourses} curso disponível` : `${totalCourses} cursos disponíveis`}
            </Typography>
          )}
        </Box>
        
        <TextField
          select
          label="Categoria"
          size="small"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          sx={{ minWidth: 200 }}
        >
          {categories.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
        </TextField>
      </Stack>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {(fetching || loading) ? (
          [...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)
        ) : (
          <>
            {courses.map((course) => <CourseCard key={course._id} course={course} />)}
            {courses.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed', borderColor: 'divider', borderRadius: 4 }}>
                <RocketLaunch sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">Nenhum curso encontrado.</Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {!fetching && totalCourses > COURSES_PER_PAGE && (
        <Stack sx={{ mt: 6, alignItems: 'center' }}>
          <Pagination count={Math.ceil(totalCourses / COURSES_PER_PAGE)} page={page} onChange={handlePageChange} color="primary" />
        </Stack>
      )}
    </Container>
  );
};

export default Home;