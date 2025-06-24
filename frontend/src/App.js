import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { ThemeProvider, CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';

import theme from './theme';

import Home from './pages/Home';
import CoursesPage from './pages/CoursesPage';
import CourseCreatePage from './pages/CoursesPage/CourseCreatePage';
import CoursePage from './pages/CoursePage'; 
import LessonPage from './pages/CoursePage/LessonPage'; 
import Member from './pages/Member/Profile'; 

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* O Box aqui é para dar um espaçamento geral do topo, você pode ajustar se necessário */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Box component="main" sx={{ flexGrow: 1 }}> {/* flexGrow para o conteúdo principal ocupar o espaço */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cursos" element={<CoursesPage />} />
              <Route path="/cursos/criar" element={<CourseCreatePage />} /> {/* Rota para criar um novo curso */}
              <Route path="/cursos/:courseSlug" element={<CoursePage />} /> {/* Rota para os detalhes do curso */}
              <Route path="/cursos/:courseSlug/aula/:lessonSlug" element={<LessonPage />} /> {/* Rota para a lição específica */}
              <Route path="/membro" element={<Member />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;