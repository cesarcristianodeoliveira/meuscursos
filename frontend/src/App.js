import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  Box, 
  Toolbar, 
  useScrollTrigger, 
  Slide, 
  Fade, 
  Fab,
  LinearProgress,
  Typography
} from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material'; 
import { ThemeProviderWrapper } from './contexts/ThemeContext';
import { CourseProvider, useCourse } from './contexts/CourseContext'; // Importando o novo contexto
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Course from './pages/Course';
import Search from './pages/Search';

// Componente para mostrar o progresso global de geração
const GlobalGenerationProgress = () => {
  const { isGenerating, progress, statusMessage } = useCourse();

  if (!isGenerating) return null;

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 64, // Logo abaixo da Toolbar padrão
      left: 0, 
      right: 0, 
      zIndex: 1099, // Um pouco abaixo da Navbar
      bgcolor: 'background.paper',
      boxShadow: 2,
      p: 1.5,
      borderBottom: '1px solid',
      borderColor: 'divider'
    }}>
      <Box sx={{ maxWidth: 'xl', margin: '0 auto', px: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="caption" fontWeight="bold" color="primary">
            {statusMessage}
          </Typography>
          <Typography variant="caption" fontWeight="bold">
            {Math.round(progress)}%
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
      </Box>
    </Box>
  );
};

function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {React.cloneElement(children)}
    </Slide>
  );
}

function ScrollTop() {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
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
  return (
    <Router>
      <ScrollToTop />
      <div id="back-to-top-anchor" />

      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        
        <HideOnScroll>
          <Navbar />
        </HideOnScroll>
        
        <Toolbar />

        {/* Barra de Progresso que aparece em qualquer página durante a geração */}
        <GlobalGenerationProgress />

        <Box component="main" sx={{ pb: 8 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/curso/:slug" element={<Course />} />
          </Routes>
        </Box>

        <ScrollTop />
      </Box>
    </Router>
  );
};

function App() {
  return (
    <ThemeProviderWrapper>
      <CourseProvider> {/* Provider adicionado aqui para envolver toda a lógica */}
        <AppContent />
      </CourseProvider>
    </ThemeProviderWrapper>
  );
}

export default App;