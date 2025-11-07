import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { keyframes } from '@emotion/react'

// Animação de flutuação normal
const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`

// Animação de lançamento
const launchAnimation = keyframes`
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  70% {
    transform: translateY(-100px) scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: translateY(-150px) scale(1.3);
    opacity: 0;
  }
`

const Home = () => {
  const [isLaunching, setIsLaunching] = useState(false)

  const handleRocketClick = () => {
    setIsLaunching(true)
    setTimeout(() => setIsLaunching(false), 2000)
  }

  return React.createElement(
    Box,
    { 
      sx: { 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100dvh', 
        textAlign: 'center',
        padding: 3
      } 
    },
    [
      React.createElement(RocketLaunchIcon, { 
        key: 'ico', 
        onClick: handleRocketClick,
        sx: { 
          fontSize: 72, 
          color: '#1976d2', 
          mb: 2,
          cursor: 'pointer',
          animation: isLaunching 
            ? `${launchAnimation} 2s ease-out` 
            : `${floatAnimation} 3s ease-in-out infinite`,
          filter: 'drop-shadow(0 0 8px rgba(25, 118, 210, 0.5))',
          transition: 'all 0.3s ease',
          '&:hover': {
            color: '#1565c0',
            filter: 'drop-shadow(0 0 12px rgba(25, 118, 210, 0.8))'
          }
        } 
      }),
      React.createElement(Typography, { 
        key: 'h', 
        variant: 'h4', 
        sx: { 
          fontWeight: 'bold',
          mb: 1
        } 
      }, 'Meus Cursos'),
      React.createElement(Typography, { 
        key: 's', 
        variant: 'subtitle1', 
        color: 'textSecondary' 
      }, 'Cursos com Inteligência Artificial')
    ]
  )
}

export default Home