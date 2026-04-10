import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

// Componentes do Layout
import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import MainGrid from './components/MainGrid';
import SideMenu from './components/SideMenu';

/**
 * DASHBOARD LAYOUT
 * Este arquivo agora funciona apenas como a moldura (Menu + Topo).
 * O conteúdo central é decidido pelas rotas internas.
 */
export default function Dashboard() {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* Menu Lateral Fixo */}
      <SideMenu />

      {/* Barra de Navegação Superior (Mobile) */}
      <AppNavbar />

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
          overflow: 'auto',
          minHeight: '100vh',
        })}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: 'center',
            mx: 3,
            pb: 5,
            mt: { xs: 8, md: 0 }, // Espaçamento para não ficar debaixo da Navbar no mobile
          }}
        >
          {/* O Header pode conter o título da página atual e o perfil */}
          <Header />
          
          {/* SISTEMA DE SUB-ROTAS INTERNAS 
            Aqui o Dashboard decide o que mostrar no 'miolo' da página.
          */}
          <Routes>
            {/* Rota padrão: Mostra a grade de cursos/estatísticas */}
            <Route path="/" element={<MainGrid />} />

            {/* Futuras rotas serão adicionadas aqui, ex:
                <Route path="gerar" element={<CreateCourse />} /> 
                <Route path="curso/:slug" element={<CourseDetails />} />
            */}
          </Routes>

        </Stack>
      </Box>
    </Box>
  );
}