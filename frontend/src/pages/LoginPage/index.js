// D:\meuscursos\frontend\src\pages\LoginPage\index.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Importa componentes do Material-UI
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link as MuiLink 
} from '@mui/material';

// Importa o hook useAuth do seu AuthContext
import { useAuth } from '../../contexts/AuthContext'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null); // Para mensagens de sucesso
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); // Hook para acessar o estado da navegação
  const { login, isAuthenticated } = useAuth(); // Pega a função 'login' e o estado 'isAuthenticated' do seu AuthContext

  // Efeito para exibir mensagens de sucesso que vêm de outras páginas (ex: após registro)
  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // Limpa o estado da localização para que a mensagem não reapareça em recargas de página
      navigate(location.pathname, { replace: true, state: {} }); 
    }
  }, [location, navigate]); // Dependências: location e navigate para evitar warnings

  // Efeito para redirecionar se o usuário já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Redireciona se já estiver logado
    }
  }, [isAuthenticated, navigate]); // Dependências: isAuthenticated e navigate

  const handleSubmit = async (e) => {
    e.preventDefault(); 

    setError(null);         // Limpa erros anteriores
    setSuccessMessage(null); // Limpa mensagens de sucesso anteriores
    setLoading(true);       // Ativa o estado de carregamento

    try {
      // Chama a função 'login' do AuthContext em vez de fazer o fetch diretamente
      const result = await login(email, password); 

      if (result.success) {
        setSuccessMessage(result.message || 'Login realizado com sucesso!');
        // O redirecionamento já será tratado pelo useEffect acima
        // que observa isAuthenticated, que é atualizado pelo AuthContext.
        // Não precisamos de setTimeout aqui, o useEffect faz o trabalho.
      } else {
        // Exibe a mensagem de erro vinda do AuthContext/backend
        setError(result.message);
      }
    } catch (err) {
      console.error('Erro ao processar login:', err);
      // Erro inesperado, talvez problema de rede
      setError('Ocorreu um erro inesperado. Tente novamente.');
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

        {/* Exibe mensagem de sucesso se houver */}
        {successMessage && (
          <Alert severity="success" sx={{ mt: 2, mb: 1 }}>
            {successMessage}
          </Alert>
        )}
        {/* Exibe mensagem de erro se houver */}
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
            {error}
          </Alert>
        )}

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
            // Adicionado inputProps para o teclado numérico e limite de caracteres
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              maxLength: 6,
            }}
          />
          
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
              <MuiLink 
                component="button" 
                variant="body2" 
                onClick={() => navigate('/cadastrar')} // Corrigido para /cadastrar
                sx={{ cursor: 'pointer' }}
              >
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