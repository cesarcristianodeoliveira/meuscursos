import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { ThemeProvider, CssBaseline } from '@mui/material';

import theme from './theme';

import Home from './pages/Home';
import CoursesPage from './pages/CoursesPage';
import CourseCreatePage from './pages/CoursesPage/CourseCreatePage';
import CoursePage from './pages/CoursePage'; 
import LessonPage from './pages/CoursePage/LessonPage'; 
import Member from './pages/Member/Profile'; 
import RegisterPage from './pages/RegisterPage'; 
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cursos" element={<CoursesPage />} />
            <Route path="/cursos/criar" element={<CourseCreatePage />} />
            <Route path="/cursos/:courseSlug" element={<CoursePage />} />
            <Route path="/cursos/:courseSlug/aula/:lessonSlug" element={<LessonPage />} />
            <Route path="/membro" element={<Member />} />
            <Route path="/cadastrar" element={<RegisterPage />} />
            <Route path="/entrar" element={<LoginPage />} />
          </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;