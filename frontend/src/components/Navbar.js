import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, IconButton, Box, 
  LinearProgress 
} from '@mui/material';
import { 
  RocketLaunch 
} from '@mui/icons-material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCourse } from '../contexts/CourseContext';

const Navbar = forwardRef((props, ref) => {
  const { resolvedMode, toggleTheme } = useAppTheme();
  const { isGenerating, progress } = useCourse();

  return (
    <AppBar 
      ref={ref} 
      {...props} 
      color="inherit" 
      position="fixed" // Alterado de sticky para fixed para garantir que a barra de progresso flutue no topo
      elevation={0}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1 // Garante que fique acima de outros elementos
      }}
    >
      {/* Barra de Progresso Estilo YouTube/NProgress */}
      {isGenerating && (
        <LinearProgress 
          color='secondary'
          variant="determinate" 
          value={progress} 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 4, // Um pouquinho mais grossa para visibilidade
            zIndex: 2000,
            backgroundColor: 'transparent',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'primary.main', // Usa a cor principal da marca
              boxShadow: '0 0 10px rgba(25, 118, 210, 0.5)', // Brilho suave
            }
          }} 
        />
      )}

      <Toolbar>
        <Box
          component={Link} 
          to="/" 
          sx={{
            alignItems: 'center',
            display: 'flex',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <RocketLaunch
            color='secondary'
            sx={{
              mr: { xs: 0, sm: 1 },
            }}
          />
          <Typography 
            color='text.primary'
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              letterSpacing: '-0.02em',
              display: { xs: 'none', sm: 'inherit' } // Ajustado para aparecer no mobile também se desejar
            }}
          >
            Meus Cursos
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton onClick={toggleTheme} color="inherit" sx={{ ml: 1 }}>
          {resolvedMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
});

export default Navbar;