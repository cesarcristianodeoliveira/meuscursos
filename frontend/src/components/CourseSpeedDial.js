// src/components/CourseSpeedDial.js
import React from 'react'
import { SpeedDial, SpeedDialIcon, SpeedDialAction } from '@mui/material'
import ShareIcon from '@mui/icons-material/Share'

const actions = [
  { icon: <ShareIcon />, name: 'Compartilhar' },
]

export default function CourseSpeedDial() {
  return (
    <SpeedDial
      ariaLabel="Ações do curso"
      icon={<SpeedDialIcon />}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: (theme) => theme.zIndex.drawer + 2, 
      }}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
        />
      ))}
    </SpeedDial>
  )
}
