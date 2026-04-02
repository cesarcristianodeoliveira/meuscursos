import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppTheme from './theme/shared-theme/AppTheme';

// Importação das suas páginas
import MarketingPage from './pages/marketing-page/MarketingPage';
import Dashboard from './pages/dashboard/Dashboard';
import SignIn from './pages/sign-in/SignIn'; // Template SignIn do MUI
import SignUp from './pages/sign-up/SignUp'; // Template SignUp do MUI

// Componente que decide o que mostrar na Home
function Home() {
  const { signed, loading } = useAuth();

  // Enquanto verifica o token, mostramos um estado neutro ou o esqueleto do Marketing
  // para evitar o "flash" de conteúdo errado
  if (loading) return null; 

  return signed ? <Dashboard /> : <MarketingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppTheme>
        <BrowserRouter>
          <Routes>
            {/* A rota principal agora é dinâmica */}
            <Route path="/" element={<Home />} />

            {/* Todas as rotas são públicas. O conteúdo interno se adapta */}
            <Route path="/login" element={<SignIn />} />
            <Route path="/register" element={<SignUp />} />
            
            {/* Exemplo: Alguém pode querer ver o Dashboard de um amigo (público) */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Rota de 404 opcional */}
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </AppTheme>
    </AuthProvider>
  );
}