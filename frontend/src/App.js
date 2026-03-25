import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  Box, 
  useScrollTrigger, 
  Fade, 
  Fab,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material'; 
import { ThemeProviderWrapper } from './contexts/ThemeContext';
import { CourseProvider } from './contexts/CourseContext'; 
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Course from './pages/Course';
import Search from './pages/Search';

function ScrollTop() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 400, 
  });

  const handleClick = (event) => {
    const tabsAnchor = document.querySelector('#tabs-scroll-point');
    const topAnchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');

    if (tabsAnchor) {
      // Lógica idêntica ao Dashboard para manter consistência
      const navHeight = isMobile ? 56 : 64;
      const tabsHeight = 48;
      
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = tabsAnchor.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      
      window.scrollTo({
        // Descontamos a Navbar e a Tab que ficará sticky
        top: elementPosition - (navHeight + tabsHeight),
        behavior: 'smooth'
      });
    } else if (topAnchor) {
      // Em outras páginas, sobe para o topo absoluto
      topAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Fade in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
      >
        <Fab color="secondary" size="small" aria-label="voltar ao topo">
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

      {/* overflowX hidden evita quebras de layout em animações laterais */}
      <Box sx={{ 
        flexGrow: 1, 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        overflowX: 'hidden' 
      }}>
        
        <Navbar />
        
        <Box component="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
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
      <CourseProvider>
        <AppContent />
      </CourseProvider>
    </ThemeProviderWrapper>
  );
}

export default App;