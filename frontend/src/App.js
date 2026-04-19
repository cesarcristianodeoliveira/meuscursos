import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import CourseView from './pages/dashboard/pages/CourseView';

/**
 * Utilitário para resetar o scroll ao navegar
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Tela de Splash elegante para carregamento de autenticação
 */
function LoadingScreen() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        width: '100vw', 
        bgcolor: 'background.default',
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
 * Proteção de rotas para áreas exclusivas de alunos
 */
function PrivateRoute({ children }) {
  const { signed, authLoading } = useAuth();
  if (authLoading) return <LoadingScreen />;
  return signed ? children : <Navigate to="/entrar" replace />;
}

/**
 * Lógica da Home: Se logado -> Dashboard, Se deslogado -> Landing Page
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
        <AppTheme {...props}>
          <CssBaseline enableColorScheme />
          
          <BrowserRouter>
            <ScrollToTop /> {/* Garante UX de topo ao navegar */}
            <Routes>
              {/* 1. Direcionamento Inteligente */}
              <Route path="/" element={<RootRoute />} />
              
              {/* 2. Fluxo de Autenticação */}
              <Route path="/entrar" element={<SignIn />} />
              <Route path="/cadastrar" element={<SignUp />} />

              {/* 3. Visualização de Curso (Pública com Upgrade para Privada)
                  Qualquer pessoa pode ver a estrutura do curso, mas o CourseView
                  internamente bloqueia o conteúdo se o usuário não estiver logado/matriculado. */}
              <Route path="/curso/:slug" element={<CourseView />} />

              {/* 4. Ecossistema do Aluno (Dashboard, Perfil, Meus Cursos) */}
              <Route 
                path="/dashboard/*" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />

              {/* Fallback de segurança */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppTheme>
      </CourseProvider>
    </AuthProvider>
  );
}