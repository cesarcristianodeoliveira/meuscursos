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
import Snackbar from '@mui/material/Snackbar';
import Grid from '@mui/material/Grid'; // Adicionado: Importação do Grid

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
  
  // Estados para mensagens de erro específicas por campo (usados internamente para validar)
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState('');

  // Estados para Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info'); // 'success', 'error', 'warning', 'info'

  const [loading, setLoading] = useState(false);
  const [fieldsDisabled, setFieldsDisabled] = useState(false); // Novo estado para desabilitar campos

  const navigate = useNavigate();
  const { register } = useAuth();

  // Função para abrir o Snackbar
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Função para fechar o Snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Função de validação para todos os campos
  // Retorna a primeira mensagem de erro encontrada ou null se tudo for válido
  const validateForm = () => {
    // Limpa todos os erros de campo antes de revalidar
    setNameError(false); setNameErrorMessage('');
    setEmailError(false); setEmailErrorMessage('');
    setPasswordError(false); setPasswordErrorMessage('');
    setConfirmPasswordError(false); setConfirmPasswordErrorMessage('');

    // Validação do Nome
    if (!name.trim()) {
      setNameError(true);
      return 'Por favor, insira seu nome completo.';
    }
    if (name.trim().length < 3) {
      setNameError(true);
      return 'O nome deve ter no mínimo 3 caracteres.';
    }
    if (name.trim().length > 80) {
      setNameError(true);
      return 'O nome deve ter no máximo 80 caracteres.';
    }

    // Validação do Email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      return 'Por favor, insira um e-mail válido.';
    }

    // Validação da Senha (exatamente 6 números)
    const passwordRegex = /^\d{6}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError(true);
      return 'A senha deve conter 6 números.';
    }

    // Validação da Confirmação de Senha
    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      return 'As senhas não coincidem!';
    }

    return null; // Retorna null se não houver erros
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpa Snackbar antes de nova tentativa
    setSnackbarOpen(false);
    
    // Executa a validação do formulário
    const validationError = validateForm();
    if (validationError) {
      // Se houver um erro de validação, exibe com severidade 'warning'
      showSnackbar(validationError, 'warning'); 
      return;
    }

    setLoading(true);
    setFieldsDisabled(true); // Desabilita campos ao iniciar o processo

    try {
      const result = await register(name, email, password); 

      if (result.success) {
        // Marca o primeiro login para ser verificado na LoginPage
        localStorage.setItem('isFirstLogin', 'true'); 
        // Se sucesso, exibe com severidade 'success'
        showSnackbar(result.message || 'Cadastro realizado com sucesso!', 'success');
        // Mantém campos desabilitados e navega após o Snackbar se fechar
        setTimeout(() => {
          navigate('/entrar', { state: { message: result.message } });
        }, 6000); // autoHideDuration do Snackbar
      } else {
        // Se erro da API, exibe com severidade 'error'
        showSnackbar(result.message, 'error');
        setFieldsDisabled(false); // Reabilita campos em caso de erro
      }
    } catch (err) {
      console.error('Erro ao processar registro:', err);
      // Se erro inesperado, exibe com severidade 'error'
      showSnackbar('Ocorreu um erro inesperado. Tente novamente.', 'error');
      setFieldsDisabled(false); // Reabilita campos em caso de erro
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
          align='center'
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
          <FormControl fullWidth>
            <TextField
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
              disabled={fieldsDisabled}
            />
          </FormControl>

          {/* Campo Email */}
          <FormControl fullWidth>
            <TextField
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
              disabled={fieldsDisabled}
            />
          </FormControl>

          {/* Senha e Confirmar Senha usando Grid */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}> {/* CORRIGIDO: Usando 'item' e 'xs', 'sm' */}
              <FormControl fullWidth>
                {/* REMOVIDO: FormLabel para Senha, conforme sua solicitação */}
                <TextField
                  name="password"
                  placeholder="Senha"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  required
                  fullWidth
                  variant="outlined"
                  value={password}
                  // Adicionado: Filtra para aceitar apenas números
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
                    setPassword(value);
                  }}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 6,
                  }}
                  disabled={fieldsDisabled}
                />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}> {/* CORRIGIDO: Usando 'item' e 'xs', 'sm' */}
              <FormControl fullWidth>
                {/* REMOVIDO: FormLabel para Confirmar Senha, conforme sua solicitação */}
                <TextField
                  name="confirmPassword"
                  placeholder="Confirmar Senha"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  required
                  fullWidth
                  variant="outlined"
                  value={confirmPassword}
                  // Adicionado: Filtra para aceitar apenas números
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
                    setConfirmPassword(value);
                  }}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 6,
                  }}
                  disabled={fieldsDisabled}
                />
              </FormControl>
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant={loading ? 'outlined' : 'contained'} // Muda a variante do botão
            sx={{ py: 1.5 }}
            disabled={loading || fieldsDisabled} // Desabilita o botão
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Cadastrar'}
          </Button>
        </Box>

        <Divider>ou</Divider> {/* Divisor "ou" */}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Botão "Entrar" com LinkComponent */}
          <Button
            fullWidth
            variant="outlined"
            LinkComponent={RouterLink}
            to='/entrar'
            disabled={fieldsDisabled}
          >
            Entrar
          </Button>
        </Box>
        {/* Copyright movido para DENTRO do Card, conforme sua última instrução */}
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          <Link color="inherit" component={RouterLink} to="/">
            {projectName}
          </Link>{' '}©{' '}
          {currentYear}
        </Typography>

        <Box sx={{ display: 'none' }}>
          {nameError}
          {nameErrorMessage}
          {emailError}
          {emailErrorMessage}
          {passwordError}
          {passwordErrorMessage}
          {confirmPasswordError}
          {confirmPasswordErrorMessage}
        </Box>

      </Card>
      
      {/* Snackbar para exibir mensagens de alerta/erro/sucesso */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000} // 6 segundos
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          icon={false} 
          // onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </SignUpContainer>
  );
}
