import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';

// Ícones atualizados para v1.3
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';

// Itens Principais (Navegação do Ecossistema)
const mainListItems = [
  { text: 'Início', icon: <HomeRoundedIcon />, path: '/' },
  { text: 'Explorar', icon: <TravelExploreIcon />, path: '/explorar' },
  { text: 'Gerar Curso', icon: <AutoAwesomeIcon />, path: '/gerar' },
  { text: 'Meus Cursos', icon: <LibraryBooksIcon />, path: '/meus-cursos' },
];

// Itens de Conta e Suporte
const secondaryListItems = [
  { text: 'Meu Perfil', icon: <AccountCircleRoundedIcon />, path: '/perfil' },
  { text: 'Configurações', icon: <SettingsRoundedIcon />, path: '/configuracoes' },
  { text: 'Suporte', icon: <HelpRoundedIcon />, path: '/feedback' },
];

export default function MenuContent() {
  const location = useLocation();

  /**
   * Função para verificar se a rota atual deve marcar o item como selecionado.
   * Isso garante que se o usuário estiver em "/perfil/algum-id", o menu "Meu Perfil"
   * ou "Início" permaneça ativo se for o caso.
   */
  const isSelected = (path) => {
    if (path === '/') return location.pathname === '/';
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
                  bgcolor: 'primary.soft', // Assumindo que seu tema tem cores soft, ou use alpha(primary, 0.1)
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
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ color: isSelected(item.path) ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.85rem',
                  fontWeight: isSelected(item.path) ? 'bold' : 'regular'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}