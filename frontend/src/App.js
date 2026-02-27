import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import Home from './pages/Home';
import Course from './pages/Course';

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <Typography 
              variant="h6" 
              component={Link} 
              to="/" 
              sx={{ fontWeight: 'bold', color: 'inherit', textDecoration: 'none' }}
            >
              Meus Cursos
            </Typography>
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/curso/:slug" element={<Course />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;