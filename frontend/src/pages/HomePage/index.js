import { Typography, Container, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import RocketIcon from '@mui/icons-material/Rocket';

function Home() {
  return (
    <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <RocketIcon sx={{ fontSize: 64 }} />
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