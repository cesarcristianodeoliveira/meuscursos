import * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/X';
import SitemarkIcon from './SitemarkIcon';

const scrollToSection = (sectionId) => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
};

function Copyright() {
  return (
    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
      <Link component={RouterLink} color="text.secondary" to="/">
        Meus Cursos
      </Link>
      {' © '}
      {new Date().getFullYear()}
    </Typography>
  );
}

export default function Footer() {
  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 4, sm: 8 },
        py: { xs: 8, sm: 10 },
        textAlign: { sm: 'center', md: 'left' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: { xs: '100%', sm: '60%' },
          }}
        >
          <Box sx={{ width: { xs: '100%', sm: '60%' } }}>
            <SitemarkIcon />
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
              Fique por dentro das novidades
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Receba atualizações semanais e dicas de cursos.
            </Typography>
            <InputLabel htmlFor="email-newsletter">E-mail</InputLabel>
            <Stack direction="row" spacing={1} useFlexGap>
              <TextField
                id="email-newsletter"
                hiddenLabel
                size="small"
                variant="outlined"
                fullWidth
                aria-label="Digite seu e-mail"
                placeholder="Digite seu e-mail"
                slotProps={{
                  htmlInput: {
                    autoComplete: 'off',
                    'aria-label': 'Digite seu e-mail',
                  },
                }}
                sx={{ width: '250px' }}
              />
              <Button
                variant="contained"
                color="primary"
                size="small"
                sx={{ flexShrink: 0 }}
              >
                Inscrever
              </Button>
            </Stack>
          </Box>
        </Box>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Plataforma
          </Typography>
          <Link onClick={() => scrollToSection('features')} color="text.secondary" variant="body2" sx={{ cursor: 'pointer' }}>
            Como funciona
          </Link>
          <Link onClick={() => scrollToSection('testimonials')} color="text.secondary" variant="body2" sx={{ cursor: 'pointer' }}>
            Depoimentos
          </Link>
          <Link onClick={() => scrollToSection('highlights')} color="text.secondary" variant="body2" sx={{ cursor: 'pointer' }}>
            Destaques
          </Link>
          <Link onClick={() => scrollToSection('pricing')} color="text.secondary" variant="body2" sx={{ cursor: 'pointer' }}>
            Preços
          </Link>
          <Link onClick={() => scrollToSection('faq')} color="text.secondary" variant="body2" sx={{ cursor: 'pointer' }}>
            FAQ
          </Link>
        </Box>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Empresa
          </Typography>
          <Link component={RouterLink} color="text.secondary" variant="body2" to="/sobre">
            Sobre
          </Link>
          <Link component={RouterLink} color="text.secondary" variant="body2" to="/blog">
            Blog
          </Link>
        </Box>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Jurídico
          </Typography>
          <Link component={RouterLink} color="text.secondary" variant="body2" to="/termos">
            Termos
          </Link>
          <Link component={RouterLink} color="text.secondary" variant="body2" to="/privacidade">
            Privacidade
          </Link>
          <Link component={RouterLink} color="text.secondary" variant="body2" to="/contato">
            Contato
          </Link>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          pt: { xs: 4, sm: 8 },
          width: '100%',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <div>
          <Link component={RouterLink} color="text.secondary" variant="body2" to="/privacidade">
            Privacidade
          </Link>
          <Typography sx={{ display: 'inline', mx: 0.5, opacity: 0.5 }}>
            &nbsp;•&nbsp;
          </Typography>
          <Link component={RouterLink} color="text.secondary" variant="body2" to="/termos">
            Termos
          </Link>
          <Copyright />
        </div>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ justifyContent: 'left', color: 'text.secondary' }}
        >
          <IconButton
            color="inherit"
            size="small"
            href="https://github.com"
            aria-label="GitHub"
            sx={{ alignSelf: 'center' }}
          >
            <GitHubIcon />
          </IconButton>
          <IconButton
            color="inherit"
            size="small"
            href="https://x.com"
            aria-label="X"
            sx={{ alignSelf: 'center' }}
          >
            <TwitterIcon />
          </IconButton>
          <IconButton
            color="inherit"
            size="small"
            href="https://www.linkedin.com"
            aria-label="LinkedIn"
            sx={{ alignSelf: 'center' }}
          >
            <LinkedInIcon />
          </IconButton>
        </Stack>
      </Box>
    </Container>
  );
}