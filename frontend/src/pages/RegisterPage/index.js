// D:\meuscursos\frontend\src\pages\RegisterPage\index.js

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

// Importa o hook useAuth do seu AuthContext
import { useAuth } from '../../contexts/AuthContext'; 

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Removido 'success' pois vamos redirecionar com mensagem

  const navigate = useNavigate();
  const { register } = useAuth(); // Pega a função 'register' do seu AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null); // Limpa qualquer erro anterior
    setLoading(true);

    // Validação frontend: senhas não coincidem
    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      setLoading(false);
      return;
    }

    // Validação frontend: exatamente 6 dígitos numéricos
    const passwordRegex = /^\d{6}$/; 
    if (!passwordRegex.test(password)) {
        setError('A senha deve conter exatamente 6 dígitos numéricos.');
        setLoading(false);
        return; 
    }

    try {
      // Chama a função 'register' do AuthContext
      const result = await register(name, email, password); 

      if (result.success) {
        // Se o registro for bem-sucedido, redireciona para a página de login
        // e passa uma mensagem de sucesso via state para ser exibida lá.
        navigate('/entrar', { state: { message: result.message } });
      } else {
        // Se houver erro (do backend via AuthContext), exibe a mensagem
        setError(result.message);
      }
    } catch (err) {
      console.error('Erro ao processar registro:', err);
      // Erro inesperado, talvez problema de rede
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}> {/* Ajustado my para mt e mb */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.paper',
          p: 4, // Ajustado p de 2 para 4 para mais padding
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Criar Nova Conta
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nome Completo" // Usando label ao invés de placeholder
            name="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email" // Usando label ao invés de placeholder
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha (6 dígitos numéricos)" // Label mais descritivo
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // Adicionado inputProps para o teclado numérico e limite de caracteres
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              maxLength: 6,
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Senha" // Usando label ao invés de placeholder
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            // Adicionado inputProps para o teclado numérico e limite de caracteres
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              maxLength: 6,
            }}
          />

          {/* Removido o Alert de sucesso, pois agora redirecionamos para a página de login com a mensagem */}
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrar'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Já tem uma conta?{' '}
              <MuiLink 
                component="button" 
                variant="body2" 
                onClick={() => navigate('/entrar')} // Corrigido para /entrar
                sx={{ cursor: 'pointer' }}
              >
                Faça login aqui.
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;