// D:\meuscursos\frontend\src\pages\LoginPage\components\SignInCard.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';

// Importa componentes do Material-UI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';

// Importa o hook useAuth do seu AuthContext
import { useAuth } from '../../../contexts/AuthContext';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles?.('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function SignInCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [generalError, setGeneralError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Efeito para exibir mensagens de sucesso que vêm de outras páginas (ex: após registro)
  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Efeito para redirecionar se o usuário já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateInputs = () => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Por favor, insira um e-mail válido.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    // A validação de senha do modelo é apenas "length < 6".
    // Se você quiser manter a sua de "6 dígitos numéricos", ajuste aqui.
    // Mantendo a do modelo por enquanto.
    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setGeneralError(null);
    setSuccessMessage(null);
    
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password); 

      if (result.success) {
        setSuccessMessage(result.message || 'Login realizado com sucesso!');
        // O redirecionamento já é tratado pelo useEffect que observa isAuthenticated
      } else {
        setGeneralError(result.message);
      }
    } catch (err) {
      console.error('Erro ao processar login:', err);
      setGeneralError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <Typography
        component="h1"
        variant="h4"
        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
      >
        Entrar
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
      >
        {/* Campo Email */}
        <FormControl>
          <TextField
            error={emailError}
            helperText={emailErrorMessage}
            id="email"
            type="email"
            name="email"
            placeholder="E-mail"
            autoComplete="email"
            required
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            color={emailError ? 'error' : 'primary'}
          />
        </FormControl>

        {/* Campo Senha */}
        <FormControl>
          <TextField
            error={passwordError}
            helperText={passwordErrorMessage}
            name="password"
            placeholder="Senha"
            type="password"
            id="password"
            autoComplete="current-password"
            required
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            color={passwordError ? 'error' : 'primary'}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              maxLength: 6,
            }}
          />
        </FormControl>

        {/* Exibe mensagem de sucesso se houver */}
        {successMessage && (
          <Alert severity="success" icon={false} sx={{ textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {successMessage}
          </Alert>
        )}
        {/* Exibe mensagem de erro se houver */}
        {generalError && (
          <Alert severity="error" icon={false} sx={{ textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {generalError}
          </Alert>
        )}
        
        <Button type="submit" fullWidth variant="contained" sx={{ py: 1.5 }} disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
        </Button>
      </Box>
      <Divider>ou</Divider>
      <Typography sx={{ textAlign: 'center' }}>
          Não tem uma conta?{' '}
          <span>
            <Link
              component={RouterLink}
              to="/cadastrar"
              variant="body2"
              sx={{ alignSelf: 'center', cursor: 'pointer' }}
            >
              Cadastrar
            </Link>
          </span>
        </Typography>
    </Card>
  );
}
