// D:\meuscursos\frontend\src\App.js

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext'; 

// Importa suas páginas e o componente de redirecionamento
import CoursesPage from './pages/CoursesPage';
import CourseCreatePage from './pages/CoursesPage/CourseCreatePage'; 
import CoursePage from './pages/CoursePage'; 
import LessonPage from './pages/CoursePage/LessonPage'; 
import MemberProfilePage from './pages/Member/Profile'; 
import RegisterPage from './pages/RegisterPage'; 
import LoginPage from './pages/LoginPage';

// Importa o HomeOrDashboardRedirect que já controla o acesso à DashboardPage
import HomeOrDashboardRedirect from './components/HomeOrDashboardRedirect'; 

import ProtectedRoute from './components/ProtectedRoute'; 
import AppTheme from './pages/shared-theme/AppTheme';

import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './pages/DashboardPage/theme/customizations';
import { CssBaseline } from '@mui/material';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

function App(props) {
  return (
    <AuthProvider> 
      <AppTheme {...props} themeComponents={xThemeComponents}>
        <CssBaseline enableColorScheme />
        <Router>
          <Routes>
            <Route path="/" element={<HomeOrDashboardRedirect />} /> 
            
            <Route path="/cursos" element={<CoursesPage />} />
            
            <Route 
              path="/cursos/criar" 
              element={
                <ProtectedRoute>
                  <CourseCreatePage />
                </ProtectedRoute>
              } 
            /> 
            
            <Route path="/cursos/:courseSlug" element={<CoursePage />} />
            <Route path="/cursos/:courseSlug/aula/:lessonSlug" element={<LessonPage />} />
            <Route path="/membro/perfil" element={<MemberProfilePage />} />
            <Route path="/cadastrar" element={<RegisterPage />} />
            <Route path="/entrar" element={<LoginPage />} />
            
          </Routes>
        </Router>
      </AppTheme>
    </AuthProvider>
  );
}

export default App;