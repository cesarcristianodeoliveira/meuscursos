import React from 'react';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import { Box } from '@mui/material';
import { Link } from 'react-router-dom';

const drawerWidth = 240; // Largura do menu lateral

function DashboardSideMenu() {
  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        <Toolbar /> {/* Para empurrar o conteúdo abaixo da AppBar */}
        <List>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/">
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/cursos">
              <ListItemIcon><SchoolIcon /></ListItemIcon>
              <ListItemText primary="Cursos" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/membro/perfil">
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Perfil" />
            </ListItemButton>
          </ListItem>
          {/* Adicione mais itens de menu aqui */}
        </List>
      </Drawer>
    </Box>
  );
}

export default DashboardSideMenu;