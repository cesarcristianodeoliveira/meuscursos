// src/components/GeneratingCourseDialog.jsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
  const [provider, setProvider] = useState(null)
  const [level, setLevel] = useState(null)

  // Etapas reais do backend
  const messages = useMemo(() => [
    'Validando dados do curso...',
    'Buscando categoria e subcategoria...',
    'Gerando conteúdo com o provider...',
    'Sanitizando e validando curso...',
    'Salvando no Sanity e finalizando...'
  ], [])

  // Usar useMemo para progressSteps
  const progressSteps = useMemo(() => [0, 20, 50, 80, 100], [])

  // Mover advanceStep para useCallback
  const advanceStep = useCallback((stepIndex) => {
    setProgress(progressSteps[stepIndex])
    setMessageIndex(stepIndex)
  }, [progressSteps]) // Agora progressSteps é estável graças ao useMemo

  // Resetar estado ao abrir modal
  useEffect(() => {
    if (!open) return
    createdRef.current = false
    setProgress(0)
    setMessageIndex(0)
    setError(null)
    setProvider(payload?.provider || null)
    setLevel(payload?.level || null)
  }, [open, payload])

  // Criar curso com etapas reais
  useEffect(() => {
    if (!open || !payload || createdRef.current) return
    createdRef.current = true

    const criarCurso = async () => {
      try {
        // Etapa 0: Validar payload
        advanceStep(0)

        if (!payload.provider || !payload.level || !payload.categoryId) {
          throw new Error('Payload incompleto. provider, level e categoryId são obrigatórios.')
        }

        // Etapa 1: Buscar categoria/subcategoria
        advanceStep(1)

        // Chamada real de generateCourse já busca categoria/subcategoria internamente
        // Etapa 2: Gerar conteúdo
        advanceStep(2)
        const result = await generateCourse(payload)

        if (!result?.course) {
          throw new Error('Retorno inválido do servidor.')
        }

        // Etapa 3: Sanitizar / Validar
        advanceStep(3)
        addCourse(result.course)
        resetCourse()

        // Etapa 4: Finalizar / Salvar
        advanceStep(4)
        const slug = result.course.slug?.current || result.course.slug
        if (slug) onFinished(slug)
        else setError('Curso criado, mas slug inválido.')

      } catch (err) {
        setError(err.message || 'Erro ao gerar curso.')
        setProgress(100)
      }
    }

    criarCurso()
  }, [open, payload, addCourse, resetCourse, onFinished, advanceStep])

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
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              Gerando Curso...
            </Typography>

            {provider && level && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Provider: <strong>{provider}</strong> | Nível: <strong>{level}</strong>
              </Typography>
            )}

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