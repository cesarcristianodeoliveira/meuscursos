// D:\meuscursos\frontend\src\App.js

import React, { Suspense, lazy } from 'react';
// REMOVIDO: useLocation, pois não será mais necessário para customizações de tema
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import { CircularProgress, Box as MuiBox } from '@mui/material'; 

import { AuthProvider, useAuth } from './contexts/AuthContext'; 

import HomeOrDashboardRedirect from './components/HomeOrDashboardRedirect'; 
import ProtectedRoute from './components/ProtectedRoute'; 

import AppTheme from './theme'; 

// REMOVIDO: Importações de customizações de componentes aqui.
// O AppTheme (frontend/src/theme/index.js) agora as importa e consolida.
// import { inputsCustomizations } from './theme/customizations/inputs';
// import { dataDisplayCustomizations } from './theme/customizations/dataDisplay';
// import { feedbackCustomizations } from './theme/customizations/feedback';
// import { navigationCustomizations } from './theme/customizations/navigation';
// import { surfacesCustomizations } from './theme/customizations/surfaces';
// import { chartsCustomizations } from './theme/customizations/charts'; 
// import { dataGridCustomizations } from './theme/customizations/dataGrid';
// import { datePickersCustomizations } from './theme/customizations/datePickers';
// import { treeViewCustomizations } from './theme/customizations/treeView';

// PÁGINAS: Importe-as DYNAMICAMENTE usando lazy
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CourseCreatePage = lazy(() => import('./pages/CoursesPage/CourseCreatePage')); 
const CoursePage = lazy(() => import('./pages/CoursesPage/CoursePage')); 
const LessonPage = lazy(() => import('./pages/CoursesPage/CoursePage/LessonPage')); 
const MemberProfilePage = lazy(() => import('./pages/Member/Profile')); 
const RegisterPage = lazy(() => import('./pages/RegisterPage')); 
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Componente Wrapper que espera APENAS o carregamento inicial da AUTENTICAÇÃO
function AppContent() {
  const { isLoadingAuthInitial } = useAuth();
  // REMOVIDO: const location = useLocation();
  // REMOVIDO: let currentThemeComponents = {}; e toda a lógica condicional de tema.

  if (isLoadingAuthInitial) {
    // Renderiza um loader global APENAS enquanto a autenticação está sendo verificada inicialmente
    return (
      <MuiBox sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} /> 
      </MuiBox>
    );
  }

  // Se a autenticação inicial já foi resolvida, renderiza as rotas
  return (
    // AppTheme agora não recebe themeComponents via prop, ele já tem todas as customizações globais.
    <AppTheme> 
      {/* Suspense envolve as rotas para lidar com o carregamento dos componentes lazy-loaded */}
      {/* Este fallback é para o tempo que leva para o JS da PÁGINA ser carregado */}
      <Suspense fallback={
        <MuiBox sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress size={60} /> 
        </MuiBox>
      }>
        <Routes>
          <Route path="/" element={<HomeOrDashboardRedirect />} /> 
          
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/cursos" element={<CoursesPage />} />
          <Route path="/cursos/:courseSlug" element={<CoursePage />} />
          <Route path="/cursos/:courseSlug/aula/:lessonSlug" element={<LessonPage />} />
          <Route path="/cadastrar" element={<RegisterPage />} />
          <Route path="/entrar" element={<LoginPage />} />

          <Route 
            path="/cursos/criar" 
            element={
              <ProtectedRoute>
                <CourseCreatePage />
              </ProtectedRoute>
            } 
          /> 
          <Route 
            path="/membro/perfil" 
            element={
              <ProtectedRoute>
                <MemberProfilePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Suspense>
    </AppTheme>
  );
}

function App(props) {
  return (
    <AuthProvider> 
      <Router>
        <AppContent /> 
      </Router>
    </AuthProvider>
  );
}

export default App;
