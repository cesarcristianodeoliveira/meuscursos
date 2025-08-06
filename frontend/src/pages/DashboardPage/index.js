    // D:\meuscursos\frontend\src\pages\DashboardPage\index.js

    import * as React from 'react';
    import { useState, useEffect } from 'react';
    import { alpha } from '@mui/material/styles';
    import Box from '@mui/material/Box';
    import Stack from '@mui/material/Stack';
    import AppNavbar from './components/AppNavbar';
    import Header from './components/Header';
    import MainGrid from './components/MainGrid';
    import SideMenu from './components/SideMenu';
    import { useAuth } from '../../contexts/AuthContext';
    // CORRIGIDO: Importa o WelcomeConfettiDialog do novo local
    import WelcomeConfettiDialog from './components/WelcomeConfettiDialog'; 

    export default function DashboardPage() { 
      const { user } = useAuth();
      const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

      useEffect(() => {
        const isFirstLogin = localStorage.getItem('isFirstLogin');
        if (isFirstLogin === 'true') {
          setShowWelcomeDialog(true);
          localStorage.removeItem('isFirstLogin');
        }
      }, []);

      const handleCloseWelcomeDialog = () => {
        setShowWelcomeDialog(false);
      };

      return (
        <Box sx={{ display: 'flex' }}>
          <SideMenu />
          <AppNavbar />
          <Box
            component="main"
            sx={(theme) => ({
              flexGrow: 1,
              backgroundColor: theme.vars
                ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                : alpha(theme.palette.background.default, 1),
              overflow: 'auto',
            })}
          >
            <Stack
              spacing={2}
              sx={{
                alignItems: 'center',
                mx: 3,
                pb: 5,
                mt: { xs: 8, md: 0 },
              }}
            >
              <Header />
              <MainGrid />
            </Stack>
          </Box>

          {/* Renderiza o WelcomeConfettiDialog condicionalmente */}
          <WelcomeConfettiDialog
            open={showWelcomeDialog}
            onClose={handleCloseWelcomeDialog}
            userName={user ? user.name : ''}
          />
        </Box>
      );
    }
    