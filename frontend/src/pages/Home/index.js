import { Typography, Container, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';

function Home() {
  return (
    <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
      <Box sx={{ textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 64 }} />
        <Typography variant="h3" component="h1" sx={{ mb: .25 }}>
          Meus Cursos
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" sx={{ mb: 2 }}>
          Cursos por Inteligência Artificial
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            component={Link} 
            to="/cursos"
          >
            Explorar
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Home;