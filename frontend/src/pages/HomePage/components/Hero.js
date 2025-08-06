import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
// import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/cadastrar');
  };

  const handleLoginClick = () => {
    navigate('/entrar');
  };

  // Funções de navegação para os novos links
  // const handleAboutClick = () => {
  //   navigate('/sobre');
  // };

  // const handleTermsClick = () => {
  //   navigate('/termos');
  // };

  // const handlePrivacyClick = () => {
  //   navigate('/privacidade');
  // };

  // const handleContactClick = () => {
  //   navigate('/contato');
  // };

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
            Meus&nbsp;
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
            Comunidade de Cursos por Inteligência Artificial.<br /> 
            Estude, ou crie para que mais pessoas aprendam.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            useFlexGap
            sx={{ pt: 2, width: { xs: '100%', sm: '256px' } }}
          >
            <Button
              variant="text"
              color="primary"
              size="large"
              onClick={handleRegisterClick}
              sx={{ flexGrow: 1 }}
            >
              Cadastrar
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleLoginClick}
              sx={{ flexGrow: 1 }}
            >
              Entrar
            </Button>
          </Stack>

          {/* Novos Links Importantes */}
          {/* <Stack
            direction="row"
            spacing={2}
            useFlexGap
            sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link component="button" variant="caption" color="primary" onClick={handleAboutClick} sx={{ cursor: 'pointer' }}>
              Sobre
            </Link>
            <Link component="button" variant="caption" color="primary" onClick={handleTermsClick} sx={{ cursor: 'pointer' }}>
              Termos
            </Link>
            <Link component="button" variant="caption" color="primary" onClick={handlePrivacyClick} sx={{ cursor: 'pointer' }}>
              Privacidade
            </Link>
            <Link component="button" variant="caption" color="primary" onClick={handleContactClick} sx={{ cursor: 'pointer' }}>
              Contato
            </Link>
          </Stack> */}
        </Stack>
        <StyledBox id="image" />
      </Container>
    </Box>
  );
}
