import * as React from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Button, Checkbox, FormControlLabel, Divider, FormLabel,
  FormControl, Link, TextField, Typography, Stack,
  Card as MuiCard, CircularProgress, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ForgotPassword from './components/ForgotPassword';
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
  borderRadius: '24px', // Borda mais arredondada para o estilo moderno
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100dvh',
  padding: theme.spacing(2),
  position: 'relative', // Garantir que o z-index funcione
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  // Estados de erro e UI
  const [errors, setErrors] = React.useState({
    email: { error: false, message: '' },
    password: { error: false, message: '' },
  });
  const [open, setOpen] = React.useState(false);
  const [backendError, setBackendError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Redirecionamento: volta para onde o usuário estava ou para a home
  const from = location.state?.from?.pathname || "/";

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const validateInputs = (data) => {
    const email = data.get('email');
    const password = data.get('password');
    let isValid = true;
    let newErrors = {
      email: { error: false, message: '' },
      password: { error: false, message: '' },
    };

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = { error: true, message: 'Insira um e-mail válido.' };
      isValid = false;
    }

    if (!password || password.length < 6) {
      newErrors.password = { error: true, message: 'A senha deve ter pelo menos 6 caracteres.' };
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
    const email = data.get('email');
    const password = data.get('password');

    try {
      const result = await signIn(email, password);

      if (result && result.success) {
        // replace: true evita que o usuário volte para o login ao clicar em "Voltar"
        navigate(from, { replace: true });
      } else {
        setBackendError(result?.error || 'E-mail ou senha incorretos.');
      }
    } catch (err) {
      setBackendError('Servidor offline. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInContainer direction="column" justifyContent="center" alignItems="center">
      <Card variant="outlined">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 2 }}>
          <SitemarkIcon />
          <Typography component="h1" variant="h4" fontWeight="900" sx={{ mt: 2 }}>
            IAcademy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bem-vindo de volta! Faça login para continuar.
          </Typography>
        </Box>

        {backendError && (
          <Alert severity="error" sx={{ mb: 1, borderRadius: '12px' }}>
            {backendError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2.5 }}
        >
          <FormControl>
            <FormLabel htmlFor="email">E-mail</FormLabel>
            <TextField
              error={errors.email.error}
              helperText={errors.email.message}
              id="email"
              type="email"
              name="email"
              placeholder="seu@email.com"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              disabled={loading}
            />
          </FormControl>
          <FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormLabel htmlFor="password">Senha</FormLabel>
              <Link
                component="button"
                type="button"
                onClick={handleClickOpen}
                variant="body2"
                fontWeight="medium"
              >
                Esqueceu a senha?
              </Link>
            </Box>
            <TextField
              error={errors.password.error}
              helperText={errors.password.message}
              name="password"
              placeholder="••••••"
              type="password"
              id="password"
              autoComplete="current-password"
              required
              fullWidth
              disabled={loading}
            />
          </FormControl>
          
          <FormControlLabel
            control={<Checkbox name="remember" color="primary" />}
            label={<Typography variant="body2">Lembrar de mim</Typography>}
            disabled={loading}
          />
          
          <ForgotPassword open={open} handleClose={handleClose} />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ py: 1.5, borderRadius: '12px', fontWeight: 'bold' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar na plataforma'}
          </Button>
        </Box>

        <Divider sx={{ my: 1 }}>
          <Typography variant="body2" color="text.secondary">ou</Typography>
        </Divider>

        <Typography sx={{ textAlign: 'center' }}>
          Ainda não tem conta?{' '}
          <Link
            component={RouterLink}
            to="/cadastrar"
            fontWeight="bold"
            sx={{ textDecoration: 'none' }}
          >
            Crie uma agora
          </Link>
        </Typography>
      </Card>
    </SignInContainer>
  );
}