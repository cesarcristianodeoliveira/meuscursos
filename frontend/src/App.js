// D:\meuscursos\frontend\src\App.js

import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';

import getAppTheme from './theme'; 

import { AuthProvider, useAuth } from './contexts/AuthContext'; 

// Importa o SEOProvider e o componente SEO
import { SEOProvider } from './contexts/SEOContext'; 
import SEO from './components/SEO'; 

// Importa suas páginas e o componente de redirecionamento
import CoursesPage from './pages/CoursesPage';
import CourseCreatePage from './pages/CoursesPage/CourseCreatePage'; 
import CoursePage from './pages/CoursePage'; 
import LessonPage from './pages/CoursePage/LessonPage'; 
import MemberProfilePage from './pages/Member/Profile'; 
import RegisterPage from './pages/RegisterPage'; 
import LoginPage from './pages/LoginPage';

// Importa o HomeOrDashboardRedirect que já controla o acesso à DashboardPage
import HomeOrDashboardRedirect from './components/HomeOrDashboardRedirect'; 

import ProtectedRoute from './components/ProtectedRoute'; 

const ThemeWrapper = ({ children }) => {
  const { user } = useAuth(); 
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const themeMode = useMemo(() => {
    if (user && user.uiSettings && user.uiSettings.themeMode) {
      if (user.uiSettings.themeMode === 'system') {
        return prefersDarkMode ? 'dark' : 'light';
      }
      return user.uiSettings.themeMode;
    }
    return prefersDarkMode ? 'dark' : 'light';
  }, [user, prefersDarkMode]);

  const theme = useMemo(() => getAppTheme(themeMode), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> 
      {children}
    </ThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider> 
      <ThemeWrapper>
        {/* SEOProvider envolve todo o Router para que o SEO seja gerenciado globalmente */}
        <SEOProvider> 
          {/* O componente SEO fica aqui, ouvindo as mudanças do contexto */}
          <SEO /> 

          <Router>
            <Routes>
              {/* A rota raiz usa HomeOrDashboardRedirect para decidir Home ou Dashboard */}
              <Route path="/" element={<HomeOrDashboardRedirect />} /> 
              
              <Route path="/cursos" element={<CoursesPage />} />
              
              <Route 
                path="/cursos/criar" 
                element={
                  <ProtectedRoute>
                    <CourseCreatePage />
                  </ProtectedRoute>
                } 
              /> 
              
              <Route path="/cursos/:courseSlug" element={<CoursePage />} />
              <Route path="/cursos/:courseSlug/aula/:lessonSlug" element={<LessonPage />} />
              <Route path="/membro/perfil" element={<MemberProfilePage />} />
              <Route path="/cadastrar" element={<RegisterPage />} />
              <Route path="/entrar" element={<LoginPage />} />
              
            </Routes>
          </Router>
        </SEOProvider> 
      </ThemeWrapper>
    </AuthProvider>
  );
}

export default App;