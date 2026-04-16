import React from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
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
    /* O Box com bgcolor garante que o tema (Dark/Light) seja aplicado 
      em toda a extensão da página de marketing imediatamente.
    */
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppAppBar />
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
  );
}