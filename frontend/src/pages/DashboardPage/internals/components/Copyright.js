import * as React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

export default function Copyright(props) {
  return (
    <Typography
      variant="body2"
      align="center"
      {...props}
      sx={[
        {
          color: 'text.secondary',
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      {'Copyright © '}
      <Button variant='text' color="inherit" LinkComponent={Link} to="/">
        Meus Cursos
      </Button>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}
