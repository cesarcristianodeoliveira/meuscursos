import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppTheme from './theme/shared-theme/AppTheme';

import MarketingPage from './pages/marketing-page/MarketingPage';
import Dashboard from './pages/dashboard/Dashboard';
import SignIn from './pages/sign-in/SignIn';
import SignUp from './pages/sign-up/SignUp';

function Home() {
  const { signed, loading } = useAuth();

  // O SEGREDO: Se estiver carregando mas já tivermos o 'user' no localStorage (signed),
  // mostramos logo o Dashboard. Se não tiver nada, mostramos o fundo do tema.
  if (loading && !signed) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          minHeight: '100vh', 
          bgcolor: 'background.default'
        }} 
      />
    );
  }

  return signed ? <Dashboard /> : <MarketingPage />;
}

export default function App(props) {
  return (
    // AppTheme e CssBaseline SEMPRE por fora para garantir as cores no segundo zero
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppTheme>
  );
}