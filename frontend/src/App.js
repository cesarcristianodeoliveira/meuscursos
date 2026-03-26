import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import { CourseProvider, useCourse } from './contexts/CourseContext'; 
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Course from './pages/Course';
import Search from './pages/Search';

function ScrollTop() {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Pegamos o estado global para saber se há paginação ativa
  // Nota: Certifique-se de que seu CourseContext exponha 'hasPagination' 
  // (totalCourses > COURSES_PER_PAGE)
  const { hasPagination } = useCourse();

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 400, 
  });

  // REGRA: O botão só aparece se estiver na Home ("/") E houver paginação
  // Se estiver em outra página (como /curso/:slug), ele aparece normalmente pelo trigger de scroll
  const shouldShow = location.pathname === '/' ? (trigger && hasPagination) : trigger;

  const handleClick = (event) => {
    const tabsAnchor = document.querySelector('#tabs-scroll-point');
    const topAnchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');

    // Se estivermos no Dashboard e o ponto das abas existir
    if (location.pathname === '/' && tabsAnchor) {
      const navHeight = isMobile ? 56 : 64;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = tabsAnchor.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      
      window.scrollTo({
        // Rolamos até as abas, descontando apenas a altura da Navbar fixa
        top: elementPosition - navHeight,
        behavior: 'smooth'
      });
    } else if (topAnchor) {
      // Em outras páginas (Curso, Search), volta para o topo real
      topAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Fade in={shouldShow}>
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

      <>
        
        <Navbar />
        
        <Box component="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/curso/:slug" element={<Course />} />
          </Routes>
        </Box>

        <ScrollTop />
      </>
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