// D:\meuscursos\frontend\src\components\ProtectedRoute\index.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, userToken } = useAuth(); // Verifica isAuthenticated e se userToken existe

  // Se o token ainda não foi carregado (primeiro render após recarregar, por exemplo)
  // ou se isAuthenticated é false, mas o token está sendo processado,
  // você pode exibir um spinner de carregamento.
  // Esta é uma abordagem mais robusta para evitar flashes de conteúdo ou redirecionamentos indesejados.
  if (userToken === undefined) { // userToken é 'undefined' antes de useState populá-lo do localStorage
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Se o usuário não está autenticado, redireciona para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace />;
  }

  // Se o usuário está autenticado, renderiza os componentes filhos
  return children;
};

export default ProtectedRoute;