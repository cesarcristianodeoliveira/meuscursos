import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Box, 
  Button, 
  Container, 
  Toolbar, 
  Typography 
} from '@mui/material'

const Welcome = () => {
  return (
    <Box 
      sx={{ 
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container
        maxWidth={'xs'}
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          px: [1],
        }}
      >
        <Toolbar sx={{ px: [0], minHeight: '56px!important' }} />
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            mt: 2
          }}
        >
          <Typography 
            variant="h4" 
            color="primary" 
            sx={{ fontWeight: 'bold', lineHeight: 1 }}
          >
            Meus Cursos
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{
              mb: 1
            }}
          >
            Cursos com Inteligência Artificial
          </Typography>
        </Box>
        <Button
          variant='contained'
          disableElevation
          LinkComponent={Link}
          to={'/criar'}
          sx={{
            minWidth: 240,
            transition: 'none'
          }}
        >
          Criar Curso
        </Button>
      </Container>
    </Box>
  )
}

export default Welcome