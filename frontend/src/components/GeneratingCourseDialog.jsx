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
    'Processando tags selecionadas...',
    'Gerando conteúdo...',
    'Salvando no Sanity...',
    'Finalizando...'
  ]

  // Resetar estado ao abrir modal
  useEffect(() => {
    if (!open) return
    createdRef.current = false
    setProgress(0)
    setMessageIndex(0)
    setError(null)
  }, [open])

  // Barra de progresso fake
  useEffect(() => {
    if (!open || createdRef.current) return

    const timer = setInterval(() => {
      setProgress(prev => (prev < 95 ? prev + 5 : prev))
    }, 400)

    return () => clearInterval(timer)
  }, [open])

  // Atualiza mensagem baseada no progresso
  useEffect(() => {
    if (progress < 25) setMessageIndex(0)
    else if (progress < 50) setMessageIndex(1)
    else if (progress < 75) setMessageIndex(2)
    else if (progress < 95) setMessageIndex(3)
    else setMessageIndex(4)
  }, [progress])

  // Criar curso
  useEffect(() => {
    if (!open || !payload || createdRef.current) return
    createdRef.current = true

    const criarCurso = async () => {
      try {
        const result = await generateCourse(payload)

        if (!result?.course) {
          setError('Retorno inválido do servidor.')
          setProgress(100)
          return
        }

        // ✅ Aqui usamos apenas addCourse do contexto, que já normaliza
        addCourse(result.course)
        resetCourse()
        setProgress(100)

        const slug = result.course.slug?.current || result.course.slug
        if (slug) onFinished(slug)
        else setError('Curso criado, mas slug inválido.')

      } catch (err) {
        setError(err.message || 'Erro ao gerar curso.')
        setProgress(100)
      }
    }

    criarCurso()
  }, [open, payload, addCourse, resetCourse, onFinished])

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      disableEscapeKeyDown
      onClose={(e, reason) => {
        if (reason === 'backdropClick') return
      }}
    >
      <DialogContent sx={{ p: 2, textAlign: 'center' }}>
        {error ? (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography sx={{ mt: 2 }}>
              Feche o app e tente novamente.
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Gerando Curso...
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
      </DialogContent>
    </Dialog>
  )
}
