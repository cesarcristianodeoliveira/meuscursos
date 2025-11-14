// src/components/ScrollTopButton.js
import React from 'react'
import PropTypes from 'prop-types'
import { useScrollTrigger, Fade, Box, Fab } from '@mui/material'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

function ScrollTop({ children, window }) {
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
    disableHysteresis: true,
    threshold: 200,
  })

  const handleClick = () => {
    window?.scrollTo
      ? window.scrollTo({ top: 0, behavior: 'smooth' })
      : document.documentElement.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Fade in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1200,
        }}
      >
        {children}
      </Box>
    </Fade>
  )
}

ScrollTop.propTypes = {
  children: PropTypes.element.isRequired,
  window: PropTypes.func,
}

export default function ScrollTopButton(props) {
  return (
    <ScrollTop {...props}>
      <Fab size="small" color="primary" aria-label="scroll back to top" sx={{ transition: 'none' }}>
        <KeyboardArrowUpIcon />
      </Fab>
    </ScrollTop>
  )
}
