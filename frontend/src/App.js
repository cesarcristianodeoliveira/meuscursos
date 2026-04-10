import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppTheme from './theme/shared-theme/AppTheme';

import MarketingPage from './pages/marketing-page/MarketingPage';
import Dashboard from './pages/dashboard/Dashboard';
import SignIn from './pages/sign-in/SignIn';
import SignUp from './pages/sign-up/SignUp';

function Home() {
  const { signed, loading } = useAuth();

  // Trava de segurança: enquanto carrega o token, mostra o spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Se logado, renderiza Dashboard na rota "/". Se não, Marketing na rota "/".
  return signed ? <Dashboard /> : <MarketingPage />;
}

export default function App(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* A rota "/*" permite que o Dashboard tenha suas sub-rotas internas */}
            <Route path="/*" element={<Home />} />
            
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppTheme>
  );
}