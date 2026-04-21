import * as React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
  FormLabel,
  FormControl,
  Link,
  TextField,
  Typography,
  Stack,
  Card as MuiCard,
  CircularProgress,
  Alert
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
  const { signIn } = useAuth();

  // Estados de erro de validação local
  const [errors, setErrors] = React.useState({
    email: { error: false, message: '' },
    password: { error: false, message: '' },
  });

  // Controle do modal de esqueci a senha
  const [open, setOpen] = React.useState(false);

  // Erros do Backend e Loading
  const [backendError, setBackendError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

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
      newErrors.email = { error: true, message: 'Por favor, insira um e-mail válido.' };
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
    
    if (!validateInputs(data)) {
      return;
    }

    setLoading(true);
    const email = data.get('email');
    const password = data.get('password');

    try {
      const result = await signIn(email, password);

      if (result && result.success) {
        navigate('/');
      } else {
        // Exibe erro vindo do backend (ex: "Senha incorreta" ou "Usuário não encontrado")
        setBackendError(result?.error || 'Falha ao entrar. Verifique suas credenciais.');
      }
    } catch (err) {
      setBackendError('Não foi possível conectar ao servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignInContainer direction="column" justifyContent="center">
      <Card variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <SitemarkIcon />
        </Box>
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center' }}
        >
          Entrar
        </Typography>

        {backendError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {backendError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2.5,
            mt: 1
          }}
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
              variant="outlined"
              disabled={loading}
              color={errors.email.error ? 'error' : 'primary'}
            />
          </FormControl>
          <FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <FormLabel htmlFor="password">Senha</FormLabel>
              <Link
                component="button"
                type="button"
                onClick={handleClickOpen}
                variant="body2"
                sx={{ alignSelf: 'baseline' }}
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
              variant="outlined"
              disabled={loading}
              color={errors.password.error ? 'error' : 'primary'}
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
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
          </Button>
        </Box>

        <Divider sx={{ my: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>ou</Typography>
        </Divider>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ textAlign: 'center' }}>
            Ainda não tem uma conta?{' '}
            <Link
              component={RouterLink}
              to="/cadastrar"
              variant="body2"
              fontWeight="bold"
            >
              Cadastre-se
            </Link>
          </Typography>
        </Box>
      </Card>
    </SignInContainer>
  );
}