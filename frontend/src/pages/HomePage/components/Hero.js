import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import visuallyHidden from '@mui/utils/visuallyHidden';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const StyledBox = styled('div')(({ theme }) => ({
  alignSelf: 'center',
  width: '100%',
  height: 400,
  marginTop: theme.spacing(8),
  borderRadius: (theme.vars || theme).shape.borderRadius,
  outline: '6px solid',
  outlineColor: 'hsla(220, 25%, 80%, 0.2)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.grey[200],
  boxShadow: '0 0 12px 8px hsla(220, 25%, 80%, 0.2)',
  backgroundImage: `url(${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/screenshots/material-ui/getting-started/templates/dashboard.jpg)`,
  backgroundSize: 'cover',
  [theme.breakpoints.up('sm')]: {
    marginTop: theme.spacing(10),
    height: 700,
  },
  ...theme.applyStyles?.('dark', {
    boxShadow: '0 0 24px 12px hsla(210, 100%, 25%, 0.2)',
    backgroundImage: `url(${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/screenshots/material-ui/getting-started/templates/dashboard-dark.jpg)`,
    outlineColor: 'hsla(220, 20%, 42%, 0.1)',
    borderColor: (theme.vars || theme).palette.grey[700],
  }),
}));

export default function Hero() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Efeito para verificar o status da inscrição ao carregar o componente
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const storedEmail = localStorage.getItem('subscribedEmail');
      if (!storedEmail) {
        setIsCheckingStatus(false);
        return;
      }
      
      setEmail(storedEmail);
      setIsCheckingStatus(true);
      
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        const apiUrl = `${backendUrl}/api/newsletter/subscribe-status?email=${storedEmail}`;
        const response = await axios.get(apiUrl);
        
        if (response.data.isSubscribed) {
          setIsSubscribed(true);
          setMessage('Você já está inscrito(a) em nossa newsletter.');
        } else {
          localStorage.removeItem('subscribedEmail');
          setEmail('');
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error('Erro ao verificar status de inscrição:', err);
        setMessage('Ocorreu um erro ao verificar sua inscrição. Por favor, tente novamente.');
        setStatus('error');
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkSubscriptionStatus();
  }, []);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setMessage('Por favor, insira um e-mail válido.');
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setStatus(null);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const apiUrl = `${backendUrl}/api/newsletter/subscribe`;
      
      await axios.post(apiUrl, { email });

      // Se a requisição for bem-sucedida
      setStatus('success');
      setMessage('Obrigado por assinar! Em breve você receberá as novidades da comunidade.');
      localStorage.setItem('subscribedEmail', email);
      setIsSubscribed(true);
    } catch (err) {
      console.error('Erro na requisição Axios:', err);
      // Se o erro for "Member Exists" (membro já inscrito), tratamos como sucesso
      if (err.response?.data?.title === 'Member Exists') {
        setStatus('success');
        setMessage('Parece que você já está inscrito(a) em nossa newsletter!');
        localStorage.setItem('subscribedEmail', email);
        setIsSubscribed(true);
      } else {
        // Para outros tipos de erro, mostramos a mensagem padrão
        setStatus('error');
        let errorMsg = err.response?.data?.message || 'Erro ao tentar se inscrever.';
        
        if (errorMsg.includes('was permanently deleted')) {
          errorMsg = 'Este e-mail foi removido permanentemente da nossa lista. Por favor, assine novamente para se re-adicionar.';
        }
        setMessage(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setMessage('');
    setStatus(null);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const apiUrl = `${backendUrl}/api/newsletter/subscribe`;
      
      await axios.delete(apiUrl, { data: { email } });

      setMessage('Sua assinatura foi cancelada com sucesso.');
      localStorage.removeItem('subscribedEmail');
      setEmail('');
      setIsSubscribed(false);
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      setMessage(err.response?.data?.message || 'Erro ao cancelar sua assinatura.');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isCheckingStatus) {
      return (
        <CircularProgress />
      );
    }

    if (isSubscribed) {
      return (
        <Stack spacing={2} sx={{ alignItems: 'center', width: { xs: '100%', sm: '70%' } }}>
          <Typography
            variant="h4"
            sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: 'primary.main',
            }}
          >
            Inscrição Realizada! 🎉
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              width: { sm: '100%', md: '80%' },
            }}
          >
            {message}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleUnsubscribe}
            disabled={isLoading}
            sx={{ minWidth: 'fit-content' }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Cancelar Assinatura'}
          </Button>
        </Stack>
      );
    }

    return (
      <Stack
        spacing={2}
        useFlexGap
        sx={{ alignItems: 'center', width: { xs: '100%', sm: '70%' } }}
      >
        <Typography
          variant="h1"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            fontSize: 'clamp(3rem, 10vw, 3.5rem)',
          }}
        >
          Comunidade&nbsp;de&nbsp;
          <Typography
            component="span"
            variant="h1"
            sx={(theme) => ({
              fontSize: 'inherit',
              color: 'primary.main',
              ...theme.applyStyles?.('dark', {
                color: 'primary.light',
              }),
            })}
          >
            Cursos
          </Typography>
        </Typography>
        <Typography
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            width: { sm: '100%', md: '80%' },
          }}
        >
          Explore nossos recursos de aprendizado e receba novidades no seu e-mail!
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{ pt: 2, width: { xs: '100%', sm: '350px' } }}
        >
          <InputLabel htmlFor="email-hero" sx={visuallyHidden}>
            Email
          </InputLabel>
          <TextField
            id="email-hero"
            hiddenLabel
            size="small"
            variant="outlined"
            aria-label="Digite seu e-mail"
            placeholder="Seu e-mail"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || isCheckingStatus}
            error={status === 'error'}
            helperText={status === 'error' ? message : ''}
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleSubscribe}
            sx={{ minWidth: 'fit-content' }}
            disabled={isLoading || isCheckingStatus || !email}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Assinar'}
          </Button>
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          Ao clicar em &quot;Assinar&quot;, você concorda com nossos&nbsp;
          <Link href="#" color="primary">
            Termos e Condições
          </Link>
          .
        </Typography>
      </Stack>
    );
  };

  return (
    <Box
      id="hero"
      sx={(theme) => ({
        width: '100%',
        backgroundRepeat: 'no-repeat',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 90%), transparent)',
        ...theme.applyStyles?.('dark', {
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(210, 100%, 16%), transparent)',
        }),
      })}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: { xs: 14, sm: 20 },
          pb: { xs: 8, sm: 12 },
        }}
      >
        {renderContent()}
        <StyledBox id="image" />
      </Container>
    </Box>
  );
}
