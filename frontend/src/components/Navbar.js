import React, { useState, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, IconButton, Box, InputBase, alpha, styled 
} from '@mui/material';
import { Brightness4, Brightness7, Search as SearchIcon } from '@mui/icons-material';
import { useAppTheme } from '../contexts/ThemeContext';

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

// Usamos forwardRef para que o Slide consiga animar a AppBar
const Navbar = forwardRef((props, ref) => {
  const { resolvedMode, toggleTheme } = useAppTheme();
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