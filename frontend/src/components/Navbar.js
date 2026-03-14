import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, IconButton, Box, 
  LinearProgress 
} from '@mui/material';
import { 
  Brightness4, 
  Brightness7, RocketLaunch 
} from '@mui/icons-material';
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
        borderBottom: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        zIndex: (theme) => theme.zIndex.drawer + 1 // Garante que fique acima de outros elementos
      }}
    >
      {/* Barra de Progresso Estilo YouTube/NProgress */}
      {isGenerating && (
        <LinearProgress 
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
            '&:hover': { opacity: 0.8 }
          }}
        >
          <RocketLaunch
            color='primary'
            sx={{
              mr: { xs: 1, sm: 1.5 },
              fontSize: '1.8rem'
            }}
          />
          <Typography 
            color='text.primary'
            variant="h6" 
            sx={{ 
              fontWeight: 800,
              letterSpacing: '-0.02em',
              display: { xs: 'inherit', sm: 'inherit' } // Ajustado para aparecer no mobile também se desejar
            }}
          >
            Meus Cursos
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton onClick={toggleTheme} color="inherit" sx={{ ml: 1 }}>
          {resolvedMode === 'dark' ? <Brightness7 color="warning" /> : <Brightness4 color="primary" />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
});

export default Navbar;