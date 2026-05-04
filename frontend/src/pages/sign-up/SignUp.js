import * as React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, Checkbox, Divider, FormControlLabel, FormLabel,
  FormControl, Link, TextField, Typography, Stack,
  Card as MuiCard, Grid, CircularProgress, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { SitemarkIcon } from './components/CustomIcons';
import { useAuth } from '../../contexts/AuthContext';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  borderRadius: '24px',
  boxShadow: 'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: { width: '450px' },
  ...theme.applyStyles('dark', {
    boxShadow: 'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100dvh',
  padding: theme.spacing(2),
  background: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
  ...theme.applyStyles('dark', {
    background: 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
  }),
}));

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth(); // Usando a função centralizada no Context

  const [errors, setErrors] = React.useState({
    name: { error: false, message: '' },
    email: { error: false, message: '' },
    password: { error: false, message: '' },
    confirmPassword: { error: false, message: '' },
  });

  const [backendError, setBackendError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const validateInputs = (data) => {
    const name = data.get('name');
    const email = data.get('email');
    const password = data.get('password');
    const confirmPassword = data.get('confirmPassword');

    let newErrors = {
      name: { error: false, message: '' },
      email: { error: false, message: '' },
      password: { error: false, message: '' },
      confirmPassword: { error: false, message: '' },
    };

    let isValid = true;

    if (!name || name.length < 2) {
      newErrors.name = { error: true, message: 'Digite seu nome completo.' };
      isValid = false;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = { error: true, message: 'Insira um e-mail válido.' };
      isValid = false;
    }
    if (!password || password.length < 6) {
      newErrors.password = { error: true, message: 'A senha deve ter pelo menos 6 caracteres.' };
      isValid = false;
    }
    if (confirmPassword !== password) {
      newErrors.confirmPassword = { error: true, message: 'As senhas não coincidem.' };
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBackendError('');
    const data = new FormData(event.currentTarget);
    
    if (!validateInputs(data)) return;

    setLoading(true);
    try {
      const result = await signUp({
        name: data.get('name'),
        email: data.get('email'),
        password: data.get('password'),
        newsletter: data.get('newsletter') === 'on',
      });

      if (result.success) {
        navigate('/'); 
      } else {
        setBackendError(result.error || 'Erro ao criar conta.');
      }
    } catch (err) {
      setBackendError('Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignUpContainer justifyContent="center" alignItems="center">
      <Card variant="outlined">
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <SitemarkIcon />
          <Typography component="h1" variant="h4" fontWeight="900" sx={{ mt: 2 }}>
            Criar Conta
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comece sua jornada no IAcademy hoje.
          </Typography>
        </Box>

        {backendError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{backendError}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl>
            <FormLabel htmlFor="name">Nome completo</FormLabel>
            <TextField
              name="name" required fullWidth id="name" placeholder="Ex: João Silva"
              error={errors.name.error} helperText={errors.name.message} disabled={loading}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel htmlFor="email">E-mail</FormLabel>
            <TextField
              required fullWidth id="email" placeholder="seu@email.com" name="email"
              error={errors.email.error} helperText={errors.email.message} disabled={loading}
            />
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormLabel htmlFor="password">Senha</FormLabel>
                <TextField
                  required fullWidth name="password" placeholder="••••••" type="password" id="password"
                  error={errors.password.error} helperText={errors.password.message} disabled={loading}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormLabel htmlFor="confirmPassword">Confirmar</FormLabel>
                <TextField
                  required fullWidth name="confirmPassword" placeholder="••••••" type="password" id="confirmPassword"
                  error={errors.confirmPassword.error} helperText={errors.confirmPassword.message} disabled={loading}
                />
              </FormControl>
            </Grid>
          </Grid>

          <FormControlLabel
            control={<Checkbox name="newsletter" color="primary" defaultChecked />}
            label={<Typography variant="caption">Aceito receber atualizações e novidades por e-mail.</Typography>}
          />
          
          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5, borderRadius: 3 }}>
            {loading ? <CircularProgress size={24} /> : 'Finalizar Cadastro'}
          </Button>
        </Box>

        <Divider>ou</Divider>

        <Typography sx={{ textAlign: 'center' }}>
          Já tem conta? <Link component={RouterLink} to="/entrar" fontWeight="bold">Entrar</Link>
        </Typography>
      </Card>
    </SignUpContainer>
  );
}