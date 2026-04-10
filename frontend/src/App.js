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

function Home() {
  const { signed, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  // Se logado, renderiza o template Dashboard. Se não, Marketing.
  // Ambos respondem pela URL "/"
  return signed ? <Dashboard /> : <MarketingPage />;
}

export default function App(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* O "/*" é a correção para o erro do console e permite sub-rotas no Dashboard */}
            <Route path="/*" element={<Home />} />
            
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Fallback para rotas não encontradas */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppTheme>
  );
}