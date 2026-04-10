import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppTheme from './theme/shared-theme/AppTheme';

// Páginas
import MarketingPage from './pages/marketing-page/MarketingPage';
import Dashboard from './pages/dashboard/Dashboard';
import SignIn from './pages/sign-in/SignIn';
import SignUp from './pages/sign-up/SignUp';

/**
 * Componente de carregamento centralizado com CircularProgress
 */
function LoadingScreen() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        bgcolor: 'background.default' 
      }}
    >
      <CircularProgress size={40} thickness={4} />
    </Box>
  );
}

/**
 * Componente que decide o que exibir na rota "/"
 * SEO: Visitantes veem a MarketingPage.
 * UX: Logados veem o Dashboard.
 */
function Home() {
  const { signed, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Se tem usuário logado, mostra o Dashboard. 
  // Se não tem (visitante/robô do Google), mostra a MarketingPage.
  return signed ? <Dashboard /> : <MarketingPage />;
}

export default function App(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rota Raiz: O coração da decisão dinâmica */}
            <Route path="/" element={<Home />} />

            {/* Rotas de Autenticação: Abertas e Diretas */}
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* DASHBOARD PÚBLICO:
              Removemos a PrivateRoute para que os cursos sejam indexáveis.
              O uso do "/*" permite que o Dashboard gerencie suas próprias sub-rotas.
            */}
            <Route path="/dashboard/*" element={<Dashboard />} />

            {/* Redirecionamento de segurança para qualquer rota inexistente */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppTheme>
  );
}