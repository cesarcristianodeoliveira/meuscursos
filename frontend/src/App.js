import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';

// Contextos
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CourseProvider } from './contexts/CourseContext'; // Importando o cérebro dos cursos

// Tema
import AppTheme from './theme/shared-theme/AppTheme';

// Páginas
import MarketingPage from './pages/marketing-page/MarketingPage';
import Dashboard from './pages/dashboard/Dashboard';
import SignIn from './pages/sign-in/SignIn';
import SignUp from './pages/sign-up/SignUp';

/**
 * Tela de carregamento persistente para evitar transições bruscas 
 * enquanto o Firebase/API valida o token do usuário.
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
      <CircularProgress />
    </Box>
  );
}

/**
 * Componente Home: Decide se o usuário vê a Landing Page 
 * ou o Dashboard administrativo.
 */
function Home() {
  const { signed, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return signed ? <Dashboard /> : <MarketingPage />;
}

export default function App(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        {/* O CourseProvider fica aqui dentro pois ele usa dados do useAuth() */}
        <CourseProvider>
          <BrowserRouter>
            <Routes>
              {/* A rota principal "/*" lida com a lógica de Home/Dashboard.
                  O Dashboard internamente gerencia rotas como /gerar e /cursos.
              */}
              <Route path="/*" element={<Home />} />
              
              {/* Rotas de Autenticação */}
              <Route path="/entrar" element={<SignIn />} />
              <Route path="/cadastrar" element={<SignUp />} />

              {/* Redirecionamento de segurança para rotas inexistentes */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </CourseProvider>
      </AuthProvider>
    </AppTheme>
  );
}