import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  useScrollTrigger, 
  Slide, 
  Fade, 
  Fab 
} from '@mui/material';
import { 
  Brightness4, 
  Brightness7, 
  KeyboardArrowUp 
} from '@mui/icons-material'; 
import { ThemeProviderWrapper, useAppTheme } from './contexts/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Course from './pages/Course';

// 1. Componente para Esconder a AppBar ao rolar
function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// 2. Componente do Botão Voltar ao Topo
function ScrollTop() {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-anchor',
    );
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Fade in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
      >
        <Fab color="primary" size="small" aria-label="voltar ao topo">
          <KeyboardArrowUp />
        </Fab>
      </Box>
    </Fade>
  );
}

const AppContent = () => {
  const { resolvedMode, toggleTheme } = useAppTheme();

  return (
    <Router>
      <ScrollToTop />
      
      {/* Ponto de ancoragem para o scroll retornar aqui */}
      <div id="back-to-top-anchor" />

      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        
        {/* Envolvendo a AppBar com a lógica de esconder */}
        <HideOnScroll>
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
              
              <IconButton onClick={toggleTheme} color="inherit">
                {resolvedMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Toolbar>
          </AppBar>
        </HideOnScroll>

        {/* Conteúdo Principal */}
        <Box component="main" sx={{ pb: 4 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/curso/:slug" element={<Course />} />
          </Routes>
        </Box>

        {/* Botão flutuante para voltar ao topo */}
        <ScrollTop />
        
      </Box>
    </Router>
  );
};

function App() {
  return (
    <ThemeProviderWrapper>
      <AppContent />
    </ThemeProviderWrapper>
  );
}

export default App;