import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { client } from '../client';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/CourseCardSkeleton';
import { Container, Typography, Box } from '@mui/material';
import { RocketLaunch } from '@mui/icons-material';

const Search = () => {
  const [searchParams] = useSearchParams();
  const queryTerm = searchParams.get('q') || '';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const sanityQuery = `*[_type == "course" && title match "${queryTerm}*"] | order(_createdAt desc)`;
      const data = await client.fetch(sanityQuery);
      setCourses(data || []);
    } catch (err) {
      console.error("Erro na busca:", err);
    } finally {
      setLoading(false);
    }
  }, [queryTerm]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Resultados para: "{queryTerm}"
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        {loading ? (
          [...Array(4)].map((_, i) => <CourseCardSkeleton key={i} />)
        ) : (
          <>
            {courses.length > 0 ? (
              courses.map(course => <CourseCard key={course._id} course={course} />)
            ) : (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <RocketLaunch sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Nenhum curso encontrado para essa busca.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default Search;