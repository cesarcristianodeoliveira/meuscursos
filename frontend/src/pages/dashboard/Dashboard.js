import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

// Componentes de Layout
import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import SideMenu from './components/SideMenu';

// Páginas
import MainGrid from './components/MainGrid';
import CreateCourse from './pages/CreateCourse'; 
import CourseView from './pages/CourseView';
import FinalExam from './pages/FinalExam';
import MyCourses from './pages/MyCourses';
import ExploreCourses from './pages/ExploreCourses'; 
import UserProfile from './pages/UserProfile';

export default function Dashboard() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Menu Lateral - Desktop */}
      <SideMenu />
      
      {/* Navbar - Mobile */}
      <AppNavbar />
      
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
          overflow: 'auto',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        })}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: 'center',
            mx: { xs: 2, md: 4 },
            pb: 5,
            mt: { xs: 10, md: 2 }, 
          }}
        >
          {/* O Header agora está dentro do fluxo de scroll */}
          <Header />

          <Box sx={{ width: '100%', maxWidth: '1200px' }}>
            <Routes>
              {/* Nota: Como esta rota está dentro de /dashboard/* no App.js,
                  o path="/" aqui corresponde a "/dashboard" na URL real. */}
              
              <Route path="/" element={<MainGrid />} />

              {/* Biblioteca Pública */}
              <Route path="explorar" element={<ExploreCourses />} />

              {/* Biblioteca do Usuário */}
              <Route path="meus-cursos" element={<MyCourses />} />

              {/* Gerador IA */}
              <Route path="gerar" element={<CreateCourse />} />

              {/* Visualização de Curso e Provas */}
              <Route path="curso/:slug" element={<CourseView />} />
              <Route path="curso/:slug/exame" element={<FinalExam />} />

              {/* Perfil (Híbrido) */}
              <Route path="perfil" element={<UserProfile />} />
              <Route path="perfil/:id" element={<UserProfile />} />
              
              {/* Caso o usuário digite algo errado dentro de /dashboard, volta para a home do dash */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}