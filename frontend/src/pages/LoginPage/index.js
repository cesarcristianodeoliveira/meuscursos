// D:\meuscursos\frontend\src\pages\LoginPage\index.js

import * as React from 'react';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

// Importa os componentes criados
import SignInCard from './components/SignInCard';
// import Content from './components/Content';

// Styled Container para a página inteira, com o fundo gradiente
const SignInContainer = styled(Stack)(({ theme }) => ({
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

export default function LoginPage() {

  return (
    <SignInContainer direction="column" component="main">
      {/* <Content /> */}
      <SignInCard />
    </SignInContainer>
  );
}
