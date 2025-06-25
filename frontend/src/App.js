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

// Importa a nova página de registro
import RegisterPage from './pages/RegisterPage'; 

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cursos" element={<CoursesPage />} />
              <Route path="/cursos/criar" element={<CourseCreatePage />} />
              <Route path="/cursos/:courseSlug" element={<CoursePage />} />
              <Route path="/cursos/:courseSlug/aula/:lessonSlug" element={<LessonPage />} />
              <Route path="/membro" element={<Member />} />
              <Route path="/cadastrar" element={<RegisterPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;