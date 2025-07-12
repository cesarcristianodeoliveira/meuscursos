import * as React from 'react';
import Divider from '@mui/material/Divider'; // Componente Divider do Material UI

// Importação dos componentes da sua página inicial
// Certifique-se de que os caminhos para esses componentes estão corretos.
// Assumo que eles estão em 'src/components/' ou em um subdiretório similar.
import AppAppBar from './components/AppAppBar'; // Barra de navegação do aplicativo
import Hero from './components/Hero';           // Seção principal de destaque
import LogoCollection from './components/LogoCollection'; // Coleção de logos de clientes/parceiros
import Highlights from './components/Highlights';         // Destaques ou diferenciais
import Pricing from './components/Pricing';               // Planos de preços
import Features from './components/Features';             // Lista de funcionalidades
import Testimonials from './components/Testimonials';     // Depoimentos de usuários
import FAQ from './components/FAQ';                       // Perguntas frequentes
import Footer from './components/Footer';                 // Rodapé do site

// Componente principal da Página Inicial
export default function HomePage() {
  return (
    <>
      {/* Barra de navegação superior */}
      <AppAppBar />
      
      {/* Seção principal de Herói (primeira dobra) */}
      <Hero />
      
      {/* Contêiner para as demais seções */}
      <div>
        {/* Coleção de logos ou marcas */}
        <LogoCollection />
        
        {/* Seção de funcionalidades do produto/serviço */}
        <Features />
        
        {/* Divisor visual entre seções */}
        <Divider />
        
        {/* Seção de depoimentos de clientes */}
        <Testimonials />
        
        {/* Divisor visual */}
        <Divider />
        
        {/* Seção de destaques ou pontos fortes */}
        <Highlights />
        
        {/* Divisor visual */}
        <Divider />
        
        {/* Seção de planos de preços */}
        <Pricing />
        
        {/* Divisor visual */}
        <Divider />
        
        {/* Seção de perguntas frequentes */}
        <FAQ />
        
        {/* Divisor visual */}
        <Divider />
        
        {/* Rodapé da página */}
        <Footer />
      </div>
    </>
  );
}