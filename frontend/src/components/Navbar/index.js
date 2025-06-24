import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

function Navbar() {
  return (
    <AppBar color='inherit' elevation={0} position="sticky">
      <Toolbar>
        <IconButton color='inherit' LinkComponent={Link} to="/">
          <HomeIcon color='inherit' />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <Button color="inherit" component={Link} to="/">
          Início
        </Button>
        <Button color="inherit" component={Link} to="/cursos">
          Cursos
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;