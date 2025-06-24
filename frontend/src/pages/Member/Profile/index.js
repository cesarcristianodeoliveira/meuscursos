import React from 'react';
import { Typography, Container, Box, Button } from '@mui/material';
import { Link, useParams } from 'react-router-dom';

function Profile() {
  const { memberId } = useParams(); // Pega o parâmetro 'memberId' da URL

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Perfil do Membro
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" sx={{ mb: 2 }}>
          Bem-vindo(a) ao perfil de: {memberId || 'Visitante'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Esta página exibirá informações detalhadas do perfil do membro, seus cursos concluídos, badges e grupos.
        </Typography>
        {/* Futuramente, teremos os dados reais do membro aqui */}
        <Button variant="contained" component={Link} to="/">
          Voltar para Home
        </Button>
      </Box>
    </Container>
  );
}

export default Profile;