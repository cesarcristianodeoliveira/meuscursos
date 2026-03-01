import React from 'react';
import { useScrollTrigger, Fade, Slide, Box, Fab } from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material';

// 1. Componente que esconde o AppBar ao rolar para baixo
export function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// 2. Componente do Botão "Voltar ao Topo"
export function ScrollTop() {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-anchor',
    );
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Fade in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}
      >
        <Fab color="primary" size="medium" aria-label="voltar ao topo">
          <KeyboardArrowUp />
        </Fab>
      </Box>
    </Fade>
  );
}