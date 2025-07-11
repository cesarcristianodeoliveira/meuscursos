import * as React from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
// Estes serão os componentes filhos do layout, adaptados ou criados
import DashboardNavbar from './DashboardNavbar'; // Renomeado de AppNavbar para evitar conflito
import DashboardSideMenu from './DashboardSideMenu'; // Renomeado de SideMenu
import DashboardHeader from './DashboardHeader'; // Renomeado de Header
import DashboardMainContent from './DashboardMainContent'; // Renomeado de MainGrid para ser mais genérico para o conteúdo da sua DashboardPage

// Assumindo que seu tema já está configurado no App.js
// e que você não precisa do AppTheme Wrapper específico do exemplo do Material UI aqui,
// já que seu App.js já tem um ThemeWrapper.

export default function DashboardLayout({ children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline enableColorScheme /> {/* Adicionado para garantir o CSS baseline aqui também */}
      <DashboardSideMenu />
      <DashboardNavbar />
      {/* Main content area */}
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
          overflow: 'auto',
          // O mt e mx do exemplo do Material UI, ajustados para seu contexto
          // Se a DashboardNavbar for fixa, talvez precise de mais margin-top
          mt: { xs: 8, md: 0 }, // Espaço para a navbar se for fixa no topo
        })}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: 'center', // Centraliza o conteúdo horizontalmente
            mx: 3, // Margem lateral
            pb: 5, // Padding bottom
            pt: { xs: 2, md: 4 }, // Adiciona um padding top para o conteúdo
          }}
        >
          {children} {/* Aqui será renderizado o conteúdo da sua DashboardPage */}
        </Stack>
      </Box>
    </Box>
  );
}