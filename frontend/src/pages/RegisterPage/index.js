// D:\meuscursos\frontend\src\pages\RegisterPage\index.js

import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';

// Styled Card para o formulário, baseado no modelo
const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
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

// Styled Container para a página inteira, com o fundo gradiente
const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  position: 'relative',
  overflow: 'auto',
  justifyContent: 'center', 
  
  // Fundo gradiente similar ao modelo oficial
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles?.('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados para mensagens de erro específicas por campo
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState('');

  const [generalError, setGeneralError] = useState(null); // Para erros gerais da API
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  // Função de validação para todos os campos
  const validateForm = () => {
    let isValid = true;

    // Validação do Nome
    if (!name.trim()) {
      setNameError(true);
      setNameErrorMessage('Por favor, insira seu nome completo.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    // Validação do Email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Por favor, insira um e-mail válido.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    // Validação da Senha (exatamente 6 dígitos numéricos)
    const passwordRegex = /^\d{6}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError(true);
      setPasswordErrorMessage('A senha deve conter exatamente 6 dígitos numéricos.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    // Validação da Confirmação de Senha
    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      setConfirmPasswordErrorMessage('As senhas não coincidem!');
      isValid = false;
    } else {
      setConfirmPasswordError(false);
      setConfirmPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralError(null); // Limpa erros gerais
    
    // Executa a validação do formulário antes de enviar
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register(name, email, password); 

      if (result.success) {
        navigate('/entrar', { state: { message: result.message } });
      } else {
        setGeneralError(result.message);
      }
    } catch (err) {
      console.error('Erro ao processar registro:', err);
      setGeneralError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear(); // Obtém o ano atual dinamicamente
  const projectName = "Meus Cursos"; // Nome do projeto

  return (
    <SignUpContainer direction="column" justifyContent="center">
      <Card variant="outlined">
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          Cadastrar
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
        >
          {/* Campo Nome Completo */}
          <FormControl>
            <TextField
              error={nameError}
              helperText={nameErrorMessage}
              id="name"
              type="text"
              name="name"
              placeholder="Nome"
              autoComplete="name"
              required
              fullWidth
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>

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
              autoComplete="new-password"
              required
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                maxLength: 6,
              }}
            />
          </FormControl>

          {/* Campo Confirmar Senha */}
          <FormControl>
            <TextField
              error={confirmPasswordError}
              helperText={confirmPasswordErrorMessage}
              name="confirmPassword"
              placeholder="Confirmar Senha"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              required
              fullWidth
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                maxLength: 6,
              }}
            />
          </FormControl>

          {/* Exibe o erro geral da API ou do formulário */}
          {generalError && (
            <Alert severity="error" icon={false} sx={{ textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {generalError}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Cadastrar'}
          </Button>
          
        </Box>

        <Divider>ou</Divider> {/* Divisor "ou" */}

        {/* Botões de Login Social */}
        <Typography sx={{ textAlign: 'center' }}>
          Já tem uma conta?{' '}
          <Link 
            component={RouterLink}
            to="/entrar"
            variant="body2" 
            sx={{ alignSelf: 'center', cursor: 'pointer' }}
          >
            Faça login aqui.
          </Link>
        </Typography>
      </Card>
      <Typography variant="body2" color="text.secondary" align="center">
        <Link color="inherit" component={RouterLink} to="/">
          {projectName}
        </Link>
        {' '}©{' '}
        {currentYear}
      </Typography>
    </SignUpContainer>
  );
}
