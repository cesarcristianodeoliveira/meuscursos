// D:\meuscursos\frontend\src\App.js

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CircularProgress, Box as MuiBox } from '@mui/material'; 

import { AuthProvider, useAuth } from './contexts/AuthContext'; 

import HomeOrDashboardRedirect from './components/HomeOrDashboardRedirect'; 
import ProtectedRoute from './components/ProtectedRoute'; 

import AppTheme from './theme'; 

import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './theme/customizations'; 

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

// PÁGINAS: Importe-as DYNAMICAMENTE usando lazy
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CourseCreatePage = lazy(() => import('./pages/CoursesPage/CourseCreatePage')); 
const CoursePage = lazy(() => import('./pages/CoursePage')); 
const LessonPage = lazy(() => import('./pages/CoursePage/LessonPage')); 
const MemberProfilePage = lazy(() => import('./pages/Member/Profile')); 
const RegisterPage = lazy(() => import('./pages/RegisterPage')); 
const LoginPage = lazy(() => import('./pages/LoginPage'));


// Componente Wrapper que espera APENAS o carregamento inicial da AUTENTICAÇÃO
function AppContent() {
  const { isLoadingAuthInitial } = useAuth(); // Use o novo estado para carregamento inicial da autenticação

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
    <Router>
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
    </Router>
  );
}

function App(props) {
  return (
    <AuthProvider> 
      <AppTheme {...props} themeComponents={xThemeComponents}>
        <AppContent /> 
      </AppTheme>
    </AuthProvider>
  );
}

export default App;