import React from 'react';
import { Box, Typography, Container } from '@mui/material';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3, // padding top/bottom
        px: 2, // padding left/right
        mt: 'auto', // pushes the footer to the bottom
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'Meus Cursos'}
          {' © '}
          {new Date().getFullYear()}
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;