import React from 'react'
import { Box, LinearProgress } from '@mui/material'
import { useCourse } from '../context/CourseContext'

const TopProgress = () => {
  const { progressVisible } = useCourse()
  if (!progressVisible) return null

  return React.createElement(Box, {
    sx: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1600 },
    children: React.createElement(LinearProgress, null)
  })
}

export default TopProgress
