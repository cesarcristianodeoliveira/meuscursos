import React, { useEffect, useState } from 'react'
import { Box, Typography, CircularProgress, Divider } from '@mui/material'
import { useParams } from 'react-router-dom'
import { getCourseById } from '../services/api'

const CourseEditor = () => {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        const data = await getCourseById(id)
        setCourse(data)
      } catch (err) {
        console.error('Erro ao buscar curso:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [id])

  if (loading) {
    return React.createElement(
      Box,
      { sx: { display: 'flex', justifyContent: 'center', mt: 8 } },
      React.createElement(CircularProgress, null)
    )
  }

  if (!course) {
    return React.createElement(
      Box,
      { sx: { mt: 8, textAlign: 'center' } },
      React.createElement(Typography, { variant: 'h6' }, 'Curso não encontrado')
    )
  }

  return React.createElement(
    Box,
    { sx: { maxWidth: 800, mx: 'auto', mt: 4 } },
    [
      React.createElement(Typography, { key: 'title', variant: 'h4', gutterBottom: true }, course.title || 'Sem título'),
      React.createElement(Divider, { key: 'divider', sx: { mb: 2 } }),
      React.createElement(Typography, { key: 'desc', variant: 'body1', paragraph: true }, course.description || 'Sem descrição.'),
      React.createElement(
        Box,
        { key: 'meta', sx: { mt: 2 } },
        [
          React.createElement(Typography, { key: 'level', variant: 'body2' }, `Nível: ${course.level || 'N/A'}`),
          React.createElement(Typography, { key: 'duration', variant: 'body2' }, `Duração: ${course.duration || 0} minutos`),
          React.createElement(Typography, { key: 'provider', variant: 'body2' }, `Fornecedor: ${course.provider || '-'}`)
        ]
      )
    ]
  )
}

export default CourseEditor
