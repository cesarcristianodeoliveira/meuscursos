import { Typography, Container, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useSEO } from '../../contexts/SEOContext'; // Importe o useSEO aqui

function Home() {
  // Use o hook useSEO para definir as meta tags desta página
  useSEO({
    title: "Meus Cursos - Cursos Online com Inteligência Artificial",
    description: "Crie e aprenda cursos online de forma inovadora com a ajuda da Inteligência Artificial. Desenvolvimento, tecnologia e muito mais.",
    keywords: "cursos online, inteligência artificial, IA, aprendizado, desenvolvimento, tecnologia, plataforma de cursos, cursos gerados por IA",
    ogTitle: "Meus Cursos: Aprendizado Acelerado com IA",
    ogDescription: "A plataforma líder para criar e consumir cursos online gerados por inteligência artificial. Transforme seu conhecimento.",
    ogImage: "https://meuscursos.netlify.app/imagens/home-social-share.jpg", // **Mude para uma imagem relevante para sua home page**
    ogUrl: "https://meuscursos.netlify.app/", // **Mude para a URL da sua home page**
    canonicalUrl: "https://meuscursos.netlify.app/", // **Mude para a URL canônica da sua home page**
  });

  return (
    <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <RocketLaunchIcon sx={{ fontSize: 64 }} />
        <Typography variant="h3" component="h1" sx={{ mb: .25 }}>
          Meus Cursos
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" sx={{ mb: 2 }}>
          Cursos por Inteligência Artificial
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            disableElevation
            variant="outlined" 
            color="primary" 
            size="large" 
            component={Link} 
            to="/cadastrar"
          >
            Cadastrar
          </Button>
          <Button 
            disableElevation
            variant="contained" 
            color="primary" 
            size="large" 
            component={Link} 
            to="/entrar"
          >
            Entrar
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Home;