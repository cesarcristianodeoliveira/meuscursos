// D:\meuscursos\frontend\src\pages\DashboardPage\index.js
import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext'; // Importe o useAuth
import { Link, useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth(); // Pega o usuário e a função de logout do contexto
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Chama a função de logout do contexto
    navigate('/entrar'); // Redireciona para a página de login após o logout
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.paper',
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Bem-vindo ao seu Dashboard!
        </Typography>
        {user && (
          <Typography variant="h6" sx={{ mb: 2 }}>
            Olá, {user.name}! (ID: {user._id || ''}) 
          </Typography>
        )}
        <Typography variant="body1" sx={{ mb: 4, textAlign: 'center' }}>
          Aqui é onde você verá seu progresso, cursos e outras informações importantes.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            color="primary" 
            component={Link} 
            variant="contained" 
            to="/cursos/criar"
            sx={{ py: 1.5 }}
          >
            Criar Curso
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleLogout}
            sx={{ py: 1.5 }}
          >
            Sair (Logout)
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardPage;