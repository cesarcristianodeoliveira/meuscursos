import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ColorModeIconDropdown from '../../../shared-theme/ColorModeIconDropdown';
import MeusCursosIcon from './MeusCursosIcon';
import { Link } from 'react-router-dom'

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: 'blur(24px)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  // Aumentado o nível da sombra para torná-la mais visível
  boxShadow: (theme.vars || theme).shadows[4], // Alterado de shadows[1] para shadows[4]
  padding: '8px 12px',
}));

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0, // Mantém a AppBar principal sem sombra, focando na StyledToolbar
        bgcolor: 'transparent',
        backgroundImage: 'none',
        mt: 'calc(var(--template-frame-height, 0px) + 28px)',
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
            <MeusCursosIcon />
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Button LinkComponent={Link} to='/cursos' variant="text" color="info" size="small">
                Cursos
              </Button>
              <Button LinkComponent={Link} to='/membros' variant="text" color="info" size="small">
                Membros
              </Button>
              <Button LinkComponent={Link} to='/grupos' variant="text" color="info" size="small">
                Grupos
              </Button>
              <Button LinkComponent={Link} to='/planos' variant="text" color="info" size="small">
                Planos
              </Button>
              <Button LinkComponent={Link} to='/blog' variant="text" color="info" size="small" sx={{ minWidth: 0 }}>
                Blog
              </Button>
              <Button LinkComponent={Link} to='/sobre' variant="text" color="info" size="small" sx={{ minWidth: 0 }}>
                Sobre
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Button LinkComponent={Link} to='/cadastrar' color="primary" variant="text" size="small">
              Cadastrar
            </Button>
            <Button LinkComponent={Link} to='/entrar' color="primary" variant="contained" size="small">
              Entrar
            </Button>
            <ColorModeIconDropdown />
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            <ColorModeIconDropdown size="medium" />
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  top: 'var(--template-frame-height, 0px)',
                },
              }}
            >
              <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>

                <MenuItem>Cursos</MenuItem>
                <MenuItem>Membros</MenuItem>
                <MenuItem>Grupos</MenuItem>
                <MenuItem>Planos</MenuItem>
                <MenuItem>Blog</MenuItem>
                <MenuItem>Sobre</MenuItem>
                <Divider sx={{ my: 3 }} />
                <MenuItem>
                  <Button color="primary" variant="contained" fullWidth>
                    Cadastrar
                  </Button>
                </MenuItem>
                <MenuItem>
                  <Button color="primary" variant="outlined" fullWidth>
                    Entrar
                  </Button>
                </MenuItem>
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
