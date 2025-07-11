// D:\meuscursos\frontend\src\App.js

import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';

// Importa seu tema personalizado (agora é uma função)
import getAppTheme from './theme'; 

// Importa o AuthProvider e useAuth do diretório 'contexts'
import { AuthProvider, useAuth } from './contexts/AuthContext'; 

// --- NOVO: Importa o SEOProvider e o componente SEO ---
import { SEOProvider } from './contexts/SEOContext'; // Certifique-se de que este caminho está correto
import SEO from './components/SEO'; // Aponta para src/components/SEO/index.js
// --------------------------------------------------

import Navbar from './components/Navbar'

// Importa suas páginas e o componente de redirecionamento
import CoursesPage from './pages/CoursesPage';
import CourseCreatePage from './pages/CoursesPage/CourseCreatePage'; 
import CoursePage from './pages/CoursePage'; 
import LessonPage from './pages/CoursePage/LessonPage'; 
import MemberProfilePage from './pages/Member/Profile'; 
import RegisterPage from './pages/RegisterPage'; 
import LoginPage from './pages/LoginPage';
import HomeOrDashboardRedirect from './components/HomeOrDashboardRedirect'; 

// --- Importa o ProtectedRoute ---
import ProtectedRoute from './components/ProtectedRoute'; 

// Componente interno para lidar com o tema dinâmico
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
        {/* --- NOVO: SEOProvider envolve o Router e o componente SEO --- */}
        <SEOProvider> 
          {/* O componente SEO agora só precisa ser renderizado uma vez aqui.
              Ele lerá o estado do contexto para atualizar as meta tags. */}
          <SEO /> 

          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<HomeOrDashboardRedirect />} /> 
              <Route path="/cursos" element={<CoursesPage />} />
              
              {/* --- ATUALIZADO: Rota para criar curso protegida --- */}
              <Route 
                path="/cursos/criar" 
                element={
                  <ProtectedRoute>
                    <CourseCreatePage />
                  </ProtectedRoute>
                } 
              /> 
              {/* -------------------------------------------------- */}
              
              <Route path="/cursos/:courseSlug" element={<CoursePage />} />
              <Route path="/cursos/:courseSlug/aula/:lessonSlug" element={<LessonPage />} />
              <Route path="/membro/perfil" element={<MemberProfilePage />} />
              <Route path="/cadastrar" element={<RegisterPage />} />
              <Route path="/entrar" element={<LoginPage />} />
            </Routes>
          </Router>
        </SEOProvider> {/* Fim do SEOProvider */}
      </ThemeWrapper>
    </AuthProvider>
  );
}

export default App;