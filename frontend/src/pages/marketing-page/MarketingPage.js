import React from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CssBaseline from '@mui/material/CssBaseline';

// Componentes da Seção
import AppAppBar from './components/AppAppBar';
import Hero from './components/Hero';
import LogoCollection from './components/LogoCollection';
import Highlights from './components/Highlights';
import Pricing from './components/Pricing';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

export default function MarketingPage() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Garante que as cores de base do Material UI sejam aplicadas corretamente */}
      <CssBaseline enableColorScheme />
      
      {/* Navegação fixa ou absoluta dependendo do seu AppAppBar */}
      <AppAppBar />

      <Box component="main">
        <Hero />
        
        <Box sx={{ bgcolor: 'background.default' }}>
          <LogoCollection />
          <Features />
          <Divider />
          <Testimonials />
          <Divider />
          <Highlights />
          <Divider />
          <Pricing />
          <Divider />
          <FAQ />
          <Divider />
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}