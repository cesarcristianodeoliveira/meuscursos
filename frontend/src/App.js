// D:\meuscursos\frontend\src\App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

// Importa seu tema personalizado
import theme from './theme'; 

// Importa o AuthProvider do diretório 'contexts'
import { AuthProvider } from './contexts/AuthContext'; 

// Importa suas páginas
import HomePage from './pages/HomePage'; // Mantendo como HomePage para clareza
import CoursesPage from './pages/CoursesPage';
import CourseCreatePage from './pages/CoursesPage/CourseCreatePage'; // Rota para criar curso
import CoursePage from './pages/CoursePage'; 
import LessonPage from './pages/CoursePage/LessonPage'; 
import MemberProfilePage from './pages/Member/Profile'; // Renomeado para evitar conflito com 'Member' do Sanity
import RegisterPage from './pages/RegisterPage'; 
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage'; // Adicionando o DashboardPage

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Reseta o CSS para um padrão consistente */}
      {/* Envolve o BrowserRouter com o AuthProvider
        para que o contexto de autenticação esteja disponível
        em toda a sua aplicação.
      */}
      <AuthProvider> 
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} /> {/* Rota para a página inicial */}
            <Route path="/cursos" element={<CoursesPage />} /> {/* Página de listagem de cursos */}
            <Route path="/cursos/criar" element={<CourseCreatePage />} /> {/* Página para criar um novo curso */}
            <Route path="/cursos/:courseSlug" element={<CoursePage />} /> {/* Página de detalhes de um curso */}
            <Route path="/cursos/:courseSlug/aula/:lessonSlug" element={<LessonPage />} /> {/* Página de uma aula específica */}
            
            <Route path="/membro/perfil" element={<MemberProfilePage />} /> {/* Rota para o perfil do membro */}
            
            <Route path="/cadastrar" element={<RegisterPage />} /> {/* Rota de registro */}
            <Route path="/entrar" element={<LoginPage />} /> {/* Rota de login */}
            <Route path="/painel" element={<DashboardPage />} /> {/* Rota do Dashboard (página pós-login) */}

            {/* Adicione outras rotas conforme necessário */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;