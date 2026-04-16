import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
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
import ExploreCourses from './pages/ExploreCourses'; // Nova página pública
import UserProfile from './pages/UserProfile';       // Nova página de perfil

export default function Dashboard() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Menu Lateral Fixo em Desktop */}
      <SideMenu />
      
      {/* Navbar Superior para Mobile */}
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
        })}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: 'center',
            mx: { xs: 2, md: 4 },
            pb: 5,
            mt: { xs: 10, md: 2 }, // Margem maior no mobile por causa da AppNavbar
          }}
        >
          {/* O Header pode receber props se você quiser títulos dinâmicos */}
          <Header />

          <Box sx={{ width: '100%', maxWidth: '1200px' }}>
            <Routes>
              {/* Home: Estatísticas e Cursos Recentes */}
              <Route path="/" element={<MainGrid />} />

              {/* Biblioteca de Cursos (Pública) */}
              <Route path="/explorar" element={<ExploreCourses />} />

              {/* Biblioteca Pessoal do Aluno */}
              <Route path="/meus-cursos" element={<MyCourses />} />

              {/* Inteligência Artificial: Gerador de Conteúdo */}
              <Route path="/gerar" element={<CreateCourse />} />

              {/* Player do Curso v1.3 */}
              <Route path="/curso/:slug" element={<CourseView />} />

              {/* Sistema de Avaliação Final */}
              <Route path="/curso/:slug/exame" element={<FinalExam />} />

              {/* Perfil: :id é opcional. Sem ID = Meu Perfil. Com ID = Perfil Público */}
              <Route path="/perfil" element={<UserProfile />} />
              <Route path="/perfil/:id" element={<UserProfile />} />
              
              {/* Rota de Fallback (Opcional) */}
              <Route path="*" element={<MainGrid />} />
            </Routes>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}