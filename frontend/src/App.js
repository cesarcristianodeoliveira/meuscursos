import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  Box, 
  Toolbar, 
  useScrollTrigger, 
  Slide, 
  Fade, 
  Fab 
} from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material'; 
import { ThemeProviderWrapper } from './contexts/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Course from './pages/Course';
import Search from './pages/Search';

function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  // cloneElement passa as props de transição (style, ref, etc) 
  // do Slide diretamente para o componente Navbar
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
  return (
    <Router>
      <ScrollToTop />
      
      <div id="back-to-top-anchor" />

      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        
        <HideOnScroll>
          {/* O componente agora é passado diretamente para o Slide via cloneElement */}
          <Navbar />
        </HideOnScroll>
        
        <Toolbar />

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
      <AppContent />
    </ThemeProviderWrapper>
  );
}

export default App;