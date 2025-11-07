import React, { useState } from 'react'
import { Box, Typography, Button, CircularProgress, Link } from '@mui/material'
import { useCourse } from '../../context/CourseContext'
import { generateCourse } from '../../services/api'

const StepConfirm = ({ onBack }) => {
  const { category, subcategory, level } = useCourse()
  const [loading, setLoading] = useState(false)
  const [course, setCourse] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setCourse(null)
    try {
      const payload = {
        title: `Curso de ${subcategory?.title || category?.title || 'Assunto'}`,
        level: level || 'beginner',
        categoryId: category?._id,
        subcategoryId: subcategory?._id || null,
        tags: []
      }
      const res = await generateCourse(payload)
      if (res.success) {
        setCourse(res.course)
      } else {
        setError(res.error || 'Erro ao criar curso')
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return React.createElement(Box, { sx: { textAlign: 'center', mt: 2 } },
    [
      React.createElement(Typography, { key: 'p', variant: 'h6', sx: { mb: 2 } }, 'Confirme e gere o curso'),
      loading ? React.createElement(CircularProgress, { key: 'l' }) : null,
      course ? React.createElement(Box, { key: 'ok', sx: { mt: 2 } },
        [
          React.createElement(Typography, { key: 'msg', color: 'success.main' }, `✅ Curso criado: ${course.title}`),
          React.createElement(Link, { key: 'link', href: course.sanityUrl, target: '_blank', rel: 'noopener', sx: { display: 'block', mt: 1 } }, 'Abrir no Sanity Studio')
        ]
      ) : null,
      error ? React.createElement(Typography, { key: 'err', color: 'error.main', sx: { mt: 2 } }, error) : null,
      React.createElement(Box, { key: 'btns', sx: { display: 'flex', gap: 2, justifyContent: 'center', mt: 3 } },
        [
          React.createElement(Button, { key: 'back', onClick: onBack }, 'Voltar'),
          React.createElement(Button, { key: 'gen', variant: 'contained', color: 'success', onClick: handleGenerate, disabled: loading }, loading ? 'Gerando...' : 'Gerar Curso')
        ]
      )
    ]
  )
}

export default StepConfirm
