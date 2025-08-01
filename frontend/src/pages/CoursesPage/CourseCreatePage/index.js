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
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import AppNavbar from '../../DashboardPage/components/AppNavbar';
import Header from '../../DashboardPage/components/Header';
import SideMenu from '../../DashboardPage/components/SideMenu';
import AppTheme from '../../../theme';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../../../theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function CourseCreatePage(props) {
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
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu />
        <AppNavbar />
        {/* Main content */}
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
            }}
          >
            <Header />

            {/* Container para a barra de progresso, com altura fixa para evitar "salto" */}
            <Box
              sx={{
                width: '100%',
                height: loadingProgress ? '4px' : '0px', // Altura do LinearProgress, ajuste se necessário
                position: 'relative',
              }}
            >
              {loadingProgress && (
                <LinearProgress
                  sx={{
                    position: 'sticky', // Use 'sticky' para fixar ao rolar a página
                    top: 0, // Ancorado ao topo do contêiner
                    zIndex: 1500,
                  }}
                />
              )}
            </Box>

            {/* Exibe o alerta se houver uma mensagem */}
            {pageAlert.message && (
              <Container maxWidth="md">
                <Alert severity={pageAlert.severity} onClose={() => setPageAlert({ message: null, severity: null })}>
                  {pageAlert.message}
                </Alert>
              </Container>
            )}
            <CourseCreationStepper 
              onShowPageAlert={handleShowPageAlert}
              setLoadingProgress={setLoadingProgress} 
            />
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
