import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Importa componentes do Material-UI
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link as MuiLink // Renomeado para evitar conflito com o Link do react-router-dom
} from '@mui/material';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // A mesma variável de ambiente usada no RegisterPage
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o recarregamento da página

    setError(null);    // Limpa erros anteriores
    setLoading(true);  // Ativa o estado de carregamento

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sucesso no login: Armazenar o token JWT e dados do usuário no localStorage
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Exemplo: Mostrar uma mensagem de sucesso antes de redirecionar (opcional)
        // Você pode ter um estado para mensagem de sucesso aqui se quiser mostrar.
        // setSuccess('Login realizado com sucesso! Redirecionando...');

        // Redireciona para a página inicial ou dashboard após um pequeno atraso
        setTimeout(() => {
          navigate('/'); // Redireciona para a home
        }, 1000); // 1 segundo de atraso
      } else {
        setError(data.message || 'Erro ao fazer login. Credenciais inválidas.');
      }
    } catch (err) {
      console.error('Erro na requisição de login:', err);
      setError('Não foi possível conectar ao servidor. Verifique sua conexão.');
    } finally {
      setLoading(false); // Desativa o estado de carregamento
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
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
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Entrar na Sua Conta
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Não tem uma conta?{' '}
              <MuiLink component="button" variant="body2" onClick={() => navigate('/cadastrar')} sx={{ cursor: 'pointer' }}>
                Crie uma aqui.
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;