import * as React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import MainGrid from './components/MainGrid';
import SideMenu from './components/SideMenu';

// Importação das novas páginas
import CreateCourse from './pages/CreateCourse'; 
import CourseView from './pages/CourseView';
import FinalExam from './pages/FinalExam';

export default function Dashboard() {
  const location = useLocation();

  // Verificamos se o usuário está "dentro" de uma aula ou exame
  // para talvez ajustar o layout (ex: remover o Header para foco total)
  const isStudyMode = location.pathname.includes('/curso/');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SideMenu />
      <AppNavbar />
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
          overflow: 'auto',
        })}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: 'center',
            mx: 3,
            pb: 5,
            mt: { xs: 8, md: 0 },
            // Se estiver em modo de estudo, ocupamos 100% da largura
            width: '100%',
          }}
        >
          {/* Ocultamos o Header comum se estivermos visualizando um curso */}
          {!isStudyMode && <Header />}

          <Box sx={{ width: '100%', maxWidth: isStudyMode ? '100%' : '1200px' }}>
            <Routes>
              {/* Home do Dashboard: Stats e Grid de Cursos */}
              <Route path="/" element={<MainGrid />} />

              {/* Formulário de Geração de Curso */}
              <Route path="/gerar" element={<CreateCourse />} />

              {/* Visualização da Aula (v1.3) */}
              <Route path="/curso/:slug" element={<CourseView />} />

              {/* Exame Final de Certificação */}
              <Route path="/curso/:slug/exame" element={<FinalExam />} />

              {/* Rota para Listagem Geral (Opcional) */}
              <Route path="/meus-cursos" element={<MainGrid />} />
            </Routes>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}