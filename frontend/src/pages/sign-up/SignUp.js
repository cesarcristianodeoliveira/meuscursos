import * as React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormLabel,
  FormControl,
  Link,
  TextField,
  Typography,
  Stack,
  Card as MuiCard,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { SitemarkIcon } from './components/CustomIcons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

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
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100dvh',
  padding: theme.spacing(2),
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

export default function SignUp() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // Estados de erro
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
    
    if (!validateInputs(data)) {
      return;
    }

    setLoading(true);

    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      password: data.get('password'),
      newsletter: data.get('newsletter') === 'on',
    };

    try {
      const response = await api.post('/auth/register', payload);

      if (response.data.success) {
        // Login automático após sucesso no registro
        const loginResult = await signIn(payload.email, payload.password);
        if (loginResult && loginResult.success) {
          navigate('/'); 
        } else {
          navigate('/entrar'); 
        }
      } else {
        setBackendError(response.data.error || 'Erro ao criar conta.');
      }
    } catch (err) {
      setBackendError(
        err.response?.data?.error || 'Falha na comunicação com o servidor. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignUpContainer direction="column" justifyContent="center">
      <Card variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <SitemarkIcon />
        </Box>
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center', mb: 1 }}
        >
          Cadastrar
        </Typography>

        {backendError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {backendError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <FormControl>
            <FormLabel htmlFor="name">Nome completo</FormLabel>
            <TextField
              autoComplete="name"
              name="name"
              required
              fullWidth
              id="name"
              placeholder="Ex: João Silva"
              autoFocus
              disabled={loading}
              error={errors.name.error}
              helperText={errors.name.message}
            />
          </FormControl>
          
          <FormControl>
            <FormLabel htmlFor="email">E-mail</FormLabel>
            <TextField
              required
              fullWidth
              id="email"
              placeholder="seu@email.com"
              name="email"
              autoComplete="email"
              disabled={loading}
              error={errors.email.error}
              helperText={errors.email.message}
            />
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormLabel htmlFor="password">Senha</FormLabel>
                <TextField
                  required
                  fullWidth
                  name="password"
                  placeholder="••••••"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  disabled={loading}
                  error={errors.password.error}
                  helperText={errors.password.message}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormLabel htmlFor="confirmPassword">Confirmar</FormLabel>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  placeholder="••••••"
                  type="password"
                  id="confirmPassword"
                  disabled={loading}
                  error={errors.confirmPassword.error}
                  helperText={errors.confirmPassword.message}
                />
              </FormControl>
            </Grid>
          </Grid>

          <FormControlLabel
            control={<Checkbox name="newsletter" color="primary" defaultChecked />}
            label={<Typography variant="body2">Assinar boletim informativo.</Typography>}
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Criar Conta'}
          </Button>
        </Box>

        <Divider sx={{ my: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>ou</Typography>
        </Divider>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ textAlign: 'center' }}>
            Já tem uma conta?{' '}
            <Link
              component={RouterLink}
              to="/entrar"
              variant="body2"
              fontWeight="bold"
            >
              Entrar
            </Link>
          </Typography>
        </Box>
      </Card>
    </SignUpContainer>
  );
}