// D:\meuscursos\frontend\src\pages\LoginPage\index.js

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

// Importa os componentes criados
import SignInCard from './components/SignInCard';
import Content from './components/Content';

// Styled Container para a página inteira, com o fundo gradiente
const SignInContainer = styled(Stack)(({ theme }) => ({
  justifyContent: 'center',
  minHeight: '100dvh',
  position: 'relative',
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

export default function LoginPage() {
  const currentYear = new Date().getFullYear();
  const projectName = "Meus Cursos";

  return (
    <SignInContainer direction="column" component="main">
      <Stack
        direction={{ xs: 'column-reverse', md: 'row' }} // Conteúdo e formulário lado a lado no desktop, empilhados no mobile
        sx={{
          justifyContent: 'center',
          gap: { xs: 6, sm: 12 },
          p: { xs: 2, sm: 4 }, // Padding responsivo para o Stack interno
          mx: 'auto', // Centraliza o Stack interno
        }}
      >
        <Content /> {/* O lado do conteúdo */}
        <SignInCard /> {/* O card de login */}
      </Stack>

      {/* Copyright adicionado abaixo do Stack principal, dentro do SignInContainer */}
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2, mb: 2 }}>
        <Link color="inherit" component={RouterLink} to="/">
          {projectName}
        </Link>
        {' '}©{' '}
        {currentYear}
      </Typography>
    </SignInContainer>
  );
}
