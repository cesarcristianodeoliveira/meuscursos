import React from 'react'
import { Box, Typography } from '@mui/material'

const CoursesList = () => {
  return React.createElement(Box, { sx: { p: 2 } },
    React.createElement(Typography, { variant: 'h5' }, 'Lista de Cursos (em breve)')
  )
}

export default CoursesList
