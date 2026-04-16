import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';

// Componentes Internos
import SelectContent from './SelectContent';
import MenuContent from './MenuContent';
import CardAlert from './CardAlert';
import OptionsMenu from './OptionsMenu';

// Contexto
import { useAuth } from '../../../contexts/AuthContext';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

export default function SideMenu() {
  const { user, signed } = useAuth();

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* LOGO / SELETOR DE ESPAÇO */}
      <Box
        sx={{
          display: 'flex',
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
          p: 1.5,
        }}
      >
        <SelectContent />
      </Box>
      
      <Divider />

      {/* NAVEGAÇÃO PRINCIPAL */}
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MenuContent />
        
        {/* O CardAlert pode ser usado para avisos de créditos baixos ou promoções PRO */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          <CardAlert />
        </Box>
      </Box>

      {/* RODAPÉ: PERFIL OU LOGIN */}
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        {signed ? (
          <>
            <Avatar
              alt={user?.name}
              src={user?.avatar}
              sx={{ 
                width: 36, 
                height: 36, 
                fontSize: '0.9rem', 
                bgcolor: 'primary.main',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            <Box sx={{ mr: 'auto', overflow: 'hidden' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  lineHeight: '16px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user?.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user?.email}
              </Typography>
            </Box>
            <OptionsMenu />
          </>
        ) : (
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', mb: 0.5 }}>
              Acesse sua conta para salvar progresso
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                fullWidth
                size="small"
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Entrar
              </Button>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                fullWidth
                size="small"
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Criar
              </Button>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}