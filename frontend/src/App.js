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
import CourseView from './pages/dashboard/pages/CourseView'; // Importado para rota híbrida

function LoadingScreen() {
  return (
    <Box 
      sx={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        minHeight: '100vh', width: '100vw', bgcolor: 'background.default',
        position: 'fixed', top: 0, left: 0, zIndex: 9999
      }}
    >
      <CircularProgress />
    </Box>
  );
}

function PrivateRoute({ children }) {
  const { signed, authLoading } = useAuth();
  if (authLoading) return <LoadingScreen />;
  return signed ? children : <Navigate to="/entrar" replace />;
}

function RootRoute() {
  const { signed, authLoading } = useAuth();
  if (authLoading) return <LoadingScreen />;
  return signed ? <Navigate to="/dashboard" replace /> : <MarketingPage />;
}

export default function App(props) {
  return (
    <AuthProvider>
      <CourseProvider>
        <AppTheme {...props}>
          <CssBaseline enableColorScheme />
          
          <BrowserRouter>
            <Routes>
              {/* 1. Rota Raiz Inteligente */}
              <Route path="/" element={<RootRoute />} />
              
              {/* 2. Autenticação */}
              <Route path="/entrar" element={<SignIn />} />
              <Route path="/cadastrar" element={<SignUp />} />

              {/* 3. ROTA HÍBRIDA (Pública/Privada)
                  Esta é a chave! Permitimos acessar o curso pelo slug.
                  O componente CourseView agora lida com 'user' logado ou não. */}
              <Route path="/curso/:slug" element={<CourseView />} />

              {/* 4. Dashboard (Área do Aluno e Gerador) */}
              <Route 
                path="/dashboard/*" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />

              {/* Redirecionamento de segurança */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppTheme>
      </CourseProvider>
    </AuthProvider>
  );
}