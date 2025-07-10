import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Container,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Pagination // Importar componente Pagination do MUI para controle mais avançado
} from '@mui/material';
import CourseCard from './components/CourseCard';
import client from '../../sanity'; // Certifique-se de que o caminho para seu cliente Sanity está correto
import { Link } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'; // Ícone para voltar

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Começa na página 1 para o usuário
  const [totalPages, setTotalPages] = useState(0); // Novo estado para o total de páginas

  const coursesPerPage = 12; // Define o número de cursos por página

  // Função para buscar o total de cursos no Sanity (necessário para paginação)
  const fetchTotalCourses = useCallback(async () => {
    try {
      const totalQuery = `count(*[_type == "course"])`;
      const total = await client.fetch(totalQuery);
      setTotalPages(Math.ceil(total / coursesPerPage)); // Calcula o total de páginas
    } catch (err) {
      console.error("Erro ao buscar o total de cursos:", err);
      // Não define erro na UI principal para esta busca secundária
    }
  }, []); // Dependência vazia, pois só precisa ser definida uma vez

  // Função para buscar os cursos com base na página atual
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Calcula o 'offset' para a query GROQ
      const offset = (currentPage - 1) * coursesPerPage;
      
      const query = `*[_type == "course"] | order(_createdAt desc) [${offset}...${offset + coursesPerPage}]{
        _id,
        title,
        "slug": slug.current,
        description,
        image {
          asset->{
            _id,
            url
          }
        },
        level,
        estimatedDuration,
        price,
        isProContent,
        status
      }`;
      const data = await client.fetch(query);
      setCourses(data);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
      setError("Não foi possível carregar os cursos. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, coursesPerPage]); // Dependências: refaz a busca ao mudar a página ou cursos por página

  // Efeito para buscar o total de cursos na montagem do componente
  useEffect(() => {
    fetchTotalCourses();
  }, [fetchTotalCourses]);

  // Efeito para buscar os cursos da página atual
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Handler para mudança de página no componente Pagination
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Renderização condicional para estados de carregamento e erro
  if (loading && courses.length === 0) { // Mostra o loader apenas se não houver cursos já carregados
    return (
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to="/" // Supondo que a home page seja a raiz
          startIcon={<ChevronLeftIcon />}
          variant="outlined"
        >
          Voltar para a Home
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" lineHeight={1}>
          Cursos Disponíveis
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/cursos/criar"
        >
          Criar Novo Curso
        </Button>
      </Box>

      {courses.length === 0 && !loading ? ( // Exibe "Nenhum curso" apenas se não estiver carregando e a lista estiver vazia
        <Alert severity="info">Nenhum curso encontrado no momento. Que tal criar um novo?</Alert>
      ) : (
        <Grid container spacing={4}> {/* Aumentei o espaçamento para melhor visual */}
          {courses.map((course) => (
            <Grid item key={course._id} xs={12} sm={6} md={4}> {/* Item para cada card */}
              <CourseCard course={course} />
            </Grid>
          ))}
        </Grid>
      )}

      {totalPages > 1 && ( // Só mostra a paginação se houver mais de uma página
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Container>
  );
}

export default CoursesPage;