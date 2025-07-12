// D:\meuscursos\frontend\src\components\HomeOrDashboardRedirect\index.js
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import HomePage from '../../pages/HomePage';
import DashboardPage from '../../pages/DashboardPage'


const HomeOrDashboardRedirect = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <DashboardPage />;
  } else {
    return <HomePage />;
  }
};

export default HomeOrDashboardRedirect;