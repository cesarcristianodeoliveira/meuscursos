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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  // O pulo do gato: Se estiver logado, renderiza o Dashboard, se não, Marketing.
  return signed ? <Dashboard /> : <MarketingPage />;
}

export default function App(props) {
  return (
    <AppTheme {...props}>
      {/* CssBaseline aqui remove as margens brancas do body em todas as telas */}
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Usamos o signed como chave para forçar a troca de template na mesma rota */}
            <Route path="/" element={<Home />} />
            
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Caso o usuário navegue manualmente para /dashboard */}
            <Route path="/dashboard/*" element={<Dashboard />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppTheme>
  );
}