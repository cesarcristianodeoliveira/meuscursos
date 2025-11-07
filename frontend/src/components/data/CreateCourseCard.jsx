import React from 'react';
import { Link } from 'react-router-dom';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export default function CreateCourseCard() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card 
      variant="outlined"
      sx={{ 
        height: '100%', 
        transition: 'none',
        p: 1
      }}
    >
      <AddRoundedIcon 
        sx={{ 
          color: 'text.secondary',
          mb: 2,
          fontSize: 32
        }} 
      />
      <Typography
        component="h2"
        variant="subtitle2"
        gutterBottom
        sx={{ 
          fontWeight: '600',
          color: 'text.primary'
        }}
      >
        Criar Novo Curso
      </Typography>
      <Typography 
        sx={{ 
          color: 'text.secondary', 
          mb: 3,
          fontSize: '0.875rem'
        }}
      >
        Comece a criar conteúdo educacional incrível para nossa comunidade.
      </Typography>
      <Button
        variant="contained"
        color="success"
        fullWidth={isSmallScreen}
        disableElevation
        component={Link}
        to="/criar"
        sx={{
          transition: 'none'
        }}
      >
        Criar Curso
      </Button>
    </Card>
  );
}