import * as React from 'react';
import Divider from '@mui/material/Divider'; // Componente Divider do Material UI

// Importação dos componentes da sua página inicial
// Mantenha os caminhos para esses componentes corretos no seu projeto.
import AppAppBar from './components/AppAppBar';     // Barra de navegação do aplicativo
import Hero from './components/Hero';               // Seção principal de destaque
import Features from './components/Features';       // Lista de funcionalidades (para alunos e criadores)
import Highlights from './components/Highlights';   // Destaques ou diferenciais (rapidez na criação com IA, qualidade)
import Testimonials from './components/Testimonials'; // Depoimentos de usuários (alunos e criadores)
import Pricing from './components/Pricing';         // Planos de preços (se aplicável para criadores)
import FAQ from './components/FAQ';                 // Perguntas frequentes (para alunos e criadores)
import Footer from './components/Footer';           // Rodapé do site

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
        {/* Seção de funcionalidades do produto/serviço */}
        <Features />
        
        {/* Divisor visual entre seções */}
        <Divider />
        
        {/* Seção de destaques ou pontos fortes */}
        <Highlights />
        
        {/* Divisor visual */}
        <Divider />

        {/* Seção de depoimentos de clientes */}
        <Testimonials />
        
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

