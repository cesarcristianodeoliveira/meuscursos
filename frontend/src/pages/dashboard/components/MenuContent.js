import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';

// Ícones
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';

// Itens Principais - Agora apontando para /dashboard/...
const mainListItems = [
  { text: 'Início', icon: <HomeRoundedIcon />, path: '/dashboard' },
  { text: 'Explorar', icon: <TravelExploreIcon />, path: '/dashboard/explorar' },
  { text: 'Gerar Curso', icon: <AutoAwesomeIcon />, path: '/dashboard/gerar' },
  { text: 'Meus Cursos', icon: <LibraryBooksIcon />, path: '/dashboard/meus-cursos' },
];

// Itens de Conta
const secondaryListItems = [
  { text: 'Meu Perfil', icon: <AccountCircleRoundedIcon />, path: '/dashboard/perfil' },
  { text: 'Configurações', icon: <SettingsRoundedIcon />, path: '/dashboard/configuracoes' },
  { text: 'Suporte', icon: <HelpRoundedIcon />, path: '/dashboard/feedback' },
];

export default function MenuContent() {
  const location = useLocation();

  // Função de seleção aprimorada para lidar com o prefixo /dashboard
  const isSelected = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton 
              component={Link} 
              to={item.path}
              selected={isSelected(item.path)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                  },
                }
              }}
            >
              <ListItemIcon sx={{ color: isSelected(item.path) ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: isSelected(item.path) ? 'bold' : 'medium',
                  color: isSelected(item.path) ? 'primary.main' : 'text.secondary'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <List dense sx={{ gap: 0.5, display: 'flex', flexDirection: 'column', mb: 2 }}>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton 
              component={Link} 
              to={item.path}
              selected={isSelected(item.path)}
              sx={{ 
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <ListItemIcon sx={{ color: isSelected(item.path) ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.85rem',
                  fontWeight: isSelected(item.path) ? 'bold' : 'regular',
                  color: isSelected(item.path) ? 'primary.main' : 'inherit'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}