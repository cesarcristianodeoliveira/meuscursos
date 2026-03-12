import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  Box, 
  useScrollTrigger, 
  Fade, 
  Fab 
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