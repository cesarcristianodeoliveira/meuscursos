import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import MainGrid from './components/MainGrid';
import SideMenu from './components/SideMenu';

// Esta é a página que vamos criar a seguir
import CreateCourse from './pages/CreateCourse'; 
import CourseView from './pages/CourseView';
import FinalExam from './pages/FinalExam';
import MyCourses from './pages/MyCourses';

export default function Dashboard() {
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
          }}
        >
          {/* O Header pode ser dinâmico ou fixo, dependendo se você quer que 
              ele mude o título conforme a página */}
          <Header />

          <Routes>
            {/* Rota Raiz do Dashboard: Mostra as estatísticas e cursos recentes */}
            <Route path="/" element={<MainGrid />} />

              {/* Formulário de Geração de Curso */}
              <Route path="/gerar" element={<CreateCourse />} />

              {/* Visualização da Aula (v1.3) */}
              <Route path="/curso/:slug" element={<CourseView />} />

              {/* Exame Final de Certificação */}
              <Route path="/curso/:slug/exame" element={<FinalExam />} />

              {/* Rota para Listagem Geral (Opcional) */}
              <Route path="/meus-cursos" element={<MyCourses />} />

            {/* Futuras rotas podem ser adicionadas aqui, ex: /perfil, /meus-cursos */}
          </Routes>
        </Stack>
      </Box>
    </Box>
  );
}