// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\index.js

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Container,
  Alert,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CourseCreationStepper from './components/CourseCreationStepper';
import { useAuth } from '../../../contexts/AuthContext';
import { alpha } from '@mui/material/styles';
import Stack from '@mui/material/Stack';

// Componentes do Dashboard (AppNavbar e SideMenu)
import AppNavbar from '../../DashboardPage/components/AppNavbar';
import Header from '../../DashboardPage/components/Header';
import SideMenu from '../../DashboardPage/components/SideMenu';

// Removidas as importações de AppTheme, CssBaseline e customizations,
// pois são gerenciadas globalmente no App.js.

export default function CourseCreatePage() {
  const [pageAlert, setPageAlert] = useState({ message: null, severity: null });
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Simula a verificação de autenticação
    const checkAuth = () => {
      if (!user) {
        navigate('/entrar');
      } else {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, [user, navigate]);

  const handleShowPageAlert = useCallback((message, severity) => {
    setPageAlert({ message, severity });
  }, []);

  // Exibe um CircularProgress de tela cheia enquanto a autenticação é verificada
  if (isAuthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    // O AppTheme e CssBaseline são aplicados no App.js, então não precisamos deles aqui.
    <Box sx={{ display: 'flex' }}> {/* Container flexível raiz, como no DashboardPage */}
      <SideMenu /> {/* SideMenu, provavelmente com position: fixed ou similar */}
      <AppNavbar /> {/* AppNavbar, provavelmente com position: fixed ou similar */}
      
      {/* Main content - Replicando a estrutura do DashboardPage */}
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1, // Ocupa o espaço restante
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
          overflow: 'auto', // Permite rolagem do conteúdo principal
          // O padding para compensar AppNavbar e SideMenu é tratado pelo mt do Stack interno
          // e pelo design dos componentes AppNavbar/SideMenu em si.
        })}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: 'center', // Centraliza o conteúdo horizontalmente
            mx: 3, // Margem horizontal
            pb: 5, // Padding inferior, como no DashboardPage
            mt: { xs: 8, md: 0 }, // Margem superior para compensar a AppNavbar no mobile
          }}
        >
          <Header />

          {/* LinearProgress posicionado dentro do Stack, com sticky para fixar ao rolar */}
          {loadingProgress && (
            <Box
              sx={{
                width: '100%',
                // A altura do Box é 4px para o LinearProgress.
                // Não precisa de 'position: relative' aqui se o LinearProgress é sticky ao Stack.
                // Apenas garante que o espaço seja reservado.
                height: '4px', 
              }}
            >
              <LinearProgress
                sx={{
                  position: 'sticky', // Fixa ao topo do contêiner pai (Stack) ao rolar
                  top: 0, // Ancorado ao topo do Stack
                  zIndex: 1500, // Garante que esteja acima de outros conteúdos
                }}
              />
            </Box>
          )}

          {/* Exibe o alerta se houver uma mensagem */}
          {pageAlert.message && (
            <Container maxWidth="md">
              <Alert severity={pageAlert.severity} onClose={() => setPageAlert({ message: null, severity: null })}>
                {pageAlert.message}
              </Alert>
            </Container>
          )}

          {/* O Stepper de criação de curso, no lugar do MainGrid */}
          <CourseCreationStepper 
            onShowPageAlert={handleShowPageAlert}
            setLoadingProgress={setLoadingProgress} 
          />
        </Stack>
      </Box>
    </Box>
  );
}
