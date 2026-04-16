import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';

// Contextos
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CourseProvider } from './contexts/CourseContext';

// Tema
import AppTheme from './theme/shared-theme/AppTheme';

// Páginas
import MarketingPage from './pages/marketing-page/MarketingPage';
import Dashboard from './pages/dashboard/Dashboard';
import SignIn from './pages/sign-in/SignIn';
import SignUp from './pages/sign-up/SignUp';

/**
 * Tela de carregamento persistente.
 * Agora ela herda background.default corretamente do AppTheme.
 */
function LoadingScreen() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        width: '100vw',
        bgcolor: 'background.default', // Crucial para não piscar branco no Dark Mode
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    >
      <CircularProgress />
    </Box>
  );
}

/**
 * Componente de Proteção de Rota
 */
function PrivateRoute({ children }) {
  const { signed, authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  
  return signed ? children : <Navigate to="/entrar" replace />;
}

/**
 * Componente da Rota Raiz
 */
function RootRoute() {
  const { signed, authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;

  return signed ? <Navigate to="/dashboard" replace /> : <MarketingPage />;
}

export default function App(props) {
  return (
    <AuthProvider>
      <CourseProvider>
        {/* O AppTheme envolve tudo o que renderiza UI, inclusive as rotas */}
        <AppTheme {...props}>
          {/* CssBaseline aplica o reset de CSS e a cor de fundo do tema no body */}
          <CssBaseline enableColorScheme />
          
          <BrowserRouter>
            <Routes>
              {/* Rota Raiz: Inteligente para Marketing ou Dashboard */}
              <Route path="/" element={<RootRoute />} />
              
              {/* Rotas de Autenticação */}
              <Route path="/entrar" element={<SignIn />} />
              <Route path="/cadastrar" element={<SignUp />} />

              {/* Dashboard Protegido: 
                  Usamos o sufixo "/*" para permitir que o roteamento interno 
                  do componente Dashboard funcione corretamente.
              */}
              <Route 
                path="/dashboard/*" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />

              {/* Redirecionamento de segurança para qualquer rota não definida */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppTheme>
      </CourseProvider>
    </AuthProvider>
  );
}