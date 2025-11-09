import React, { useEffect, useState, useRef } from 'react'
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Alert,
  Button 
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { generateCourse } from '../services/api'
import { useCourse } from '../context/CourseContext'

function GeneratingCourse() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addCourse, resetCourse } = useCourse()
  const payload = location.state?.payload

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

  // Simula a barra de progresso
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(old => (old < 100 ? old + 5 : 100))
    }, 400)
    return () => clearInterval(timer)
  }, [])

  // Atualiza mensagens conforme progresso
  useEffect(() => {
    if (progress < 25) setMessageIndex(0)
    else if (progress < 50) setMessageIndex(1)
    else if (progress < 75) setMessageIndex(2)
    else if (progress < 95) setMessageIndex(3)
    else setMessageIndex(4)
  }, [progress])

  // Cria o curso e redireciona
  useEffect(() => {
    if (!payload || createdRef.current) return
    createdRef.current = true

    const criarCurso = async () => {
      try {
        const result = await generateCourse(payload)

        if (result?.course) {
          const normalizedCourse = {
            ...result.course,
            slug: typeof result.course.slug === 'object'
              ? result.course.slug.current
              : result.course.slug,
          }

          addCourse(normalizedCourse)
          resetCourse()

          // Verificação mais robusta do slug
          const finalSlug = normalizedCourse.slug || result.course._id
          
          if (finalSlug) {
            setTimeout(() => {
              navigate(`/curso/${finalSlug}`)
            }, 1200)
          } else {
            setError('Curso criado, mas não foi possível obter o slug. Verifique o console.')
            console.error('❌ Slug e ID ausentes:', result)
          }
        } else {
          setError('Curso criado, mas estrutura de retorno inválida.')
          console.error('❌ Estrutura inválida:', result)
        }
      } catch (err) {
        setError(err.message || 'Erro ao gerar curso.')
        console.error('❌ Erro na criação:', err)
      }
    }

    criarCurso()
  }, [payload, navigate, addCourse, resetCourse])

  const handleRetry = () => {
    navigate('/criar')
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        textAlign: 'center',
        gap: 2,
        p: [1]
      }}
    >
      {/* Alert de erro */}
      {error && (
        <Alert 
          severity="error"
          sx={{ 
            width: '100%', 
            maxWidth: 400,
            mb: 2 
          }}
        >
          {error}
        </Alert>
      )}

      {/* Título */}
      <Typography variant="h5" component="h1">
        {error ? 'Erro na criação do curso' : 'Gerando seu curso personalizado...'}
      </Typography>

      {/* Barra de progresso (só mostra se não tem erro) */}
      {!error && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ 
            width: '100%', 
            maxWidth: 400, 
            height: 10, 
            borderRadius: 5 
          }}
        />
      )}

      {/* Mensagem */}
      <Typography variant="body1" color="text.secondary">
        {error ? 'Tente novamente ou verifique o console.' : messages[messageIndex]}
      </Typography>

      {/* Botões de ação (só mostra se tem erro) */}
      {error && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleRetry}
            disableElevation
          >
            Tentar Novamente
          </Button>
          <Button 
            variant="outlined"
            onClick={handleGoHome}
            disableElevation
          >
            Voltar para Início
          </Button>
        </Box>
      )}

      {/* Percentual (só mostra se não tem erro) */}
      {!error && (
        <Typography variant="body2" color="primary.main" fontWeight="bold">
          {progress}%
        </Typography>
      )}
    </Box>
  )
}

export default GeneratingCourse