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
 * Proteção de rotas para áreas exclusivas de alunos (Gerar Curso, Perfil, etc)
 */
function PrivateRoute({ children }) {
  const { signed, authLoading } = useAuth();
  
  if (authLoading) return <LoadingScreen />;
  
  // Se não estiver logado, redireciona para o entrar salvando a rota de origem
  return signed ? children : <Navigate to="/entrar" replace state={{ from: window.location.pathname }} />;
}

/**
 * Lógica da Home: Se logado -> Dashboard, Se deslogado -> Landing Page (Marketing)
 */
function RootRoute() {
  const { signed, authLoading } = useAuth();
  
  if (authLoading) return <LoadingScreen />;
  
  // Decidimos manter a MarketingPage como porta de entrada mesmo logado? 
  // Geralmente, se o usuário digita a URL pura e está logado, mandamos para o Dashboard.
  return signed ? <Navigate to="/dashboard" replace /> : <MarketingPage />;
}

export default function App(props) {
  return (
    <AuthProvider>
      <CourseProvider>
        <AppTheme {...props}>
          <CssBaseline enableColorScheme />
          
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* 1. Direcionamento Inteligente (Home ou Dashboard) */}
              <Route path="/" element={<RootRoute />} />
              
              {/* 2. Fluxo de Autenticação */}
              <Route path="/entrar" element={<SignIn />} />
              <Route path="/cadastrar" element={<SignUp />} />

              {/* 3. Visualização de Curso (PÚBLICA)
                  Aberto para SEO e visitantes. As travas de progresso e 
                  conclusão de quiz são tratadas dentro do componente CourseView. */}
              <Route path="/curso/:slug" element={<CourseView />} />

              {/* 4. Ecossistema Privado do Aluno */}
              <Route 
                path="/dashboard/*" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />

              {/* Fallback de segurança para rotas inexistentes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppTheme>
      </CourseProvider>
    </AuthProvider>
  );
}