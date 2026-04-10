import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppTheme from './theme/shared-theme/AppTheme';

import MarketingPage from './pages/marketing-page/MarketingPage';
import Dashboard from './pages/dashboard/Dashboard';
import SignIn from './pages/sign-in/SignIn';
import SignUp from './pages/sign-up/SignUp';

function Home() {
  const { signed, loading } = useAuth();

  // 1. Enquanto o AuthContext verifica o token, mostramos o loading.
  // Sem isso, o React assume que signed=false e renderiza o Marketing por erro.
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 2. Após o loading, decidimos qual template exibir na rota "/"
  return signed ? <Dashboard /> : <MarketingPage />;
}

export default function App(props) {
  return (
    <AppTheme {...props}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* AMBOS Marketing e Dashboard vivem aqui embaixo */}
            <Route path="/" element={<Home />} />

            {/* Outras rotas permanecem acessíveis */}
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Mantemos o path /dashboard/* para links internos funcionarem */}
            <Route path="/dashboard/*" element={<Dashboard />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppTheme>
  );
}