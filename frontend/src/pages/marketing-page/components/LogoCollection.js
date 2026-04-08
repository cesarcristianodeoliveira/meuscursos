import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useColorScheme } from '@mui/material/styles';

const darkModeLogos = [
  'https://cdn.simpleicons.org/sanity/ffffff',
  'https://cdn.simpleicons.org/netlify/ffffff',
  'https://cdn.simpleicons.org/nodedotjs/ffffff',
  'https://cdn.simpleicons.org/react/ffffff',
  'https://cdn.simpleicons.org/mui/ffffff',
  'https://cdn.simpleicons.org/google/ffffff',
];

const lightModeLogos = [
  'https://cdn.simpleicons.org/sanity/000000',
  'https://cdn.simpleicons.org/netlify/000000',
  'https://cdn.simpleicons.org/nodedotjs/000000',
  'https://cdn.simpleicons.org/react/000000',
  'https://cdn.simpleicons.org/mui/000000',
  'https://cdn.simpleicons.org/google/000000',
];

const logoStyle = {
  width: '100%',
  height: { xs: '32px', sm: '56px', md: '64px' },
  opacity: 0.7,
};

export default function LogoCollection() {
  const { mode, systemMode } = useColorScheme();
  let logos;
  
  if (mode === 'system') {
    if (systemMode === 'light') {
      logos = lightModeLogos;
    } else {
      logos = darkModeLogos;
    }
  } else if (mode === 'light') {
    logos = lightModeLogos;
  } else {
    logos = darkModeLogos;
  }

  return (
    <Box id="logoCollection" sx={{ py: 4 }}>
      <Typography
        component="p"
        variant="subtitle2"
        align="center"
        sx={{ color: 'text.secondary', mb: 4 }}
      >
        Tecnologias que impulsionam nosso ecossistema
      </Typography>
      <Grid container spacing={{ xs: 3, sm: 6, md: 9, lg: 12 }} sx={{ justifyContent: 'center', mt: 0.5, opacity: 0.6 }}>
        {logos.map((logo, index) => (
          <Grid key={index}>
            <Box
              component="img"
              src={logo}
              alt={`Tecnologia ${index + 1}`}
              sx={logoStyle}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}