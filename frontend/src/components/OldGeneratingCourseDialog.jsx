// src/components/GeneratingCourseDialog.jsx
import React, { useEffect, useState, useRef } from 'react'
import {
  Typography,
  LinearProgress,
  Alert,
  Dialog,
  DialogContent
} from '@mui/material'
import { generateCourse } from '../services/api'
import { useCourse } from '../context/CourseContext'

export default function GeneratingCourseDialog({ open, payload, onFinished }) {
  const { addCourse, resetCourse } = useCourse()

  const createdRef = useRef(false)
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [error, setError] = useState(null)

  const messages = [
    'Analisando categoria e subcategoria...',
    'Selecionando tags e nível...',
    'Gerando conteúdo...',
    'Salvando no Sanity...',
    'Finalizando...'
  ]

  // Progresso visual
  useEffect(() => {
    if (!open) return

    setProgress(0)
    const timer = setInterval(() => {
      setProgress(old => (old < 100 ? old + 5 : 100))
    }, 400)
    return () => clearInterval(timer)
  }, [open])

  // Mensagens dinâmicas
  useEffect(() => {
    if (progress < 25) setMessageIndex(0)
    else if (progress < 50) setMessageIndex(1)
    else if (progress < 75) setMessageIndex(2)
    else if (progress < 95) setMessageIndex(3)
    else setMessageIndex(4)
  }, [progress])

  // Criar o curso
  useEffect(() => {
    if (!open || !payload || createdRef.current) return
    createdRef.current = true

    const criarCurso = async () => {
      try {
        const result = await generateCourse(payload)

        if (result?.course) {
          const normalized = {
            ...result.course,
            slug: typeof result.course.slug === 'object'
              ? result.course.slug.current
              : result.course.slug
          }

          addCourse(normalized)
          resetCourse()

          const finalSlug = normalized.slug || result.course._id

          if (finalSlug) {
            onFinished(finalSlug)
          } else {
            setError('Curso criado, mas slug inválido.')
          }
        } else {
          setError('Retorno inválido do servidor.')
        }
      } catch (err) {
        setError(err.message || 'Erro ao gerar curso.')
      }
    }

    criarCurso()
  }, [open, payload, addCourse, resetCourse, onFinished])

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
      // 🔥 Não permite fechar clicando fora ou apertando Esc
      disableEscapeKeyDown
      onClose={(e, reason) => {
        if (reason === 'backdropClick') return
      }}
    >
      <DialogContent sx={{ p: 3, textAlign: 'center' }}>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!error && (
          <>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Gerando seu curso personalizado...
            </Typography>

            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                width: '100%',
                height: 10,
                borderRadius: 5,
                mb: 2
              }}
            />

            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {messages[messageIndex]}
            </Typography>

            <Typography variant="body2" color="primary.main" fontWeight="bold">
              {progress}%
            </Typography>
          </>
        )}

        {error && (
          <Typography sx={{ mt: 2 }}>
            Feche o app e tente de novo.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  )
}
