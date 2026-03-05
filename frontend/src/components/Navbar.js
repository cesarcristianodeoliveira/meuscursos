import React, { useState, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, IconButton, Box, InputBase, alpha, styled, LinearProgress 
} from '@mui/material';
import { Brightness4, Brightness7, Search as SearchIcon } from '@mui/icons-material';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCourse } from '../contexts/CourseContext'; // Importando o contexto de curso

const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.25) },
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.up('sm')]: { marginLeft: theme.spacing(3), width: 'auto' },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: { width: '30ch' },
  },
}));

const Navbar = forwardRef((props, ref) => {
  const { resolvedMode, toggleTheme } = useAppTheme();
  const { isGenerating, progress } = useCourse(); // Pegando o estado global
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  return (
    <AppBar ref={ref} {...props} color="primary" position="fixed" elevation={0}>
      {/* Barra de Progresso Estilo YouTube */}
      {isGenerating && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 3, // Bem fininha
            zIndex: 1500,
            backgroundColor: 'transparent',
            '& .MuiLinearProgress-bar': {
              backgroundColor: resolvedMode === 'dark' ? '#90caf9' : '#fff', // Branco no tema azul, azul claro no dark
            }
          }} 
        />
      )}

      <Toolbar>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/" 
          sx={{ fontWeight: 'bold', color: 'inherit', textDecoration: 'none', display: { xs: 'none', sm: 'block' } }}
        >
          Meus Cursos
        </Typography>

        <SearchContainer>
          <SearchIconWrapper><SearchIcon /></SearchIconWrapper>
          <StyledInputBase
            placeholder="Pesquisar"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
          />
        </SearchContainer>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton onClick={toggleTheme} color="inherit">
          {resolvedMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
});

export default Navbar;