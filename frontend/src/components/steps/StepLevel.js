import React, { useEffect } from 'react'
import { Box, Typography, ToggleButtonGroup, ToggleButton, Button } from '@mui/material'
import { useCourse } from '../../context/CourseContext'

const StepLevel = ({ onNext }) => {
  const { level, setLevel, setProgressVisible } = useCourse()

  useEffect(() => {
    setProgressVisible && setProgressVisible(true)
    const t = setTimeout(() => setProgressVisible && setProgressVisible(false), 300)
    return () => clearTimeout(t)
  }, [setProgressVisible])

  const handle = (_, v) => { if (v) setLevel(v) }

  return React.createElement(Box, { sx: { textAlign: 'center' } },
    [
      React.createElement(Typography, { key: 'label', sx: { mb: 2 } }, 'Escolha o nível do curso'),
      React.createElement(ToggleButtonGroup, { key: 'g', exclusive: true, value: level, onChange: handle, sx: { mb: 3 } },
        [
          React.createElement(ToggleButton, { key: 'b', value: 'beginner' }, 'Iniciante'),
          React.createElement(ToggleButton, { key: 'i', value: 'intermediate' }, 'Intermediário'),
          React.createElement(ToggleButton, { key: 'a', value: 'advanced' }, 'Avançado')
        ]
      ),
      React.createElement(Button, { key: 'n', variant: 'contained', onClick: onNext }, 'Próximo')
    ]
  )
}

export default StepLevel
