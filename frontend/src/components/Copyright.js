import React from 'react'
import {
  Typography,
  Link
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom';

const Copyright = () => {

  const currentYear = new Date().getFullYear();
  const projectName = "Meus Cursos";

  return (
    <>
      <Typography variant="body2" color="text.secondary">
        <Link color="inherit" component={RouterLink} to="/">
          {projectName}
        </Link>{' '}©{' '}
        {currentYear}
      </Typography>
    </>
  )
}

export default Copyright