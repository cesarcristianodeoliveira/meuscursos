import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material'; // Ícones de Lua e Sol
import { ThemeProviderWrapper, useAppTheme } from './contexts/ThemeContext';
import Home from './pages/Home';
import Course from './pages/Course';

// Componente interno para ter acesso ao useAppTheme
const AppContent = () => {
  const { resolvedMode, toggleTheme } = useAppTheme();

  return (
    <Router>
      {/* O minHeight garante que o fundo cubra a tela toda */}
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        <AppBar color="primary" position="sticky" elevation={0}>
          <Toolbar>
            <Typography 
              variant="h6" 
              component={Link} 
              to="/" 
              sx={{ fontWeight: 'bold', color: 'inherit', textDecoration: 'none' }}
            >
              Meus Cursos
            </Typography>
            <Box flexGrow={1} />
            {/* Botão de Alternar Tema */}
            <IconButton onClick={toggleTheme} color="inherit">
              {resolvedMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/curso/:slug" element={<Course />} />
        </Routes>
      </Box>
    </Router>
  );
};

// O App exporta o Provider envolvendo o conteúdo
function App() {
  return (
    <ThemeProviderWrapper>
      <AppContent />
    </ThemeProviderWrapper>
  );
}

export default App;