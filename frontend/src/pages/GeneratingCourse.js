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

const MESSAGES = [
  'Analisando categoria e subcategoria...',
  'Selecionando tags e nível...',
  'Gerando conteúdo com IA...',
  'Estruturando módulos e aulas...',
  'Salvando no Sanity CMS...',
  'Finalizando...'
]

function GeneratingCourse() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addCourse, resetCourse } = useCourse()
  const payload = location.state?.payload

  const createdRef = useRef(false)
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [error, setError] = useState(null)
  const [generatedCourse, setGeneratedCourse] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(old => {
        if (old >= 95) return 95
        return old + 4
      })
    }, 400)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const thresholds = [15, 30, 50, 70, 85, 95]
    const newIndex = thresholds.findIndex(threshold => progress < threshold)
    setMessageIndex(newIndex >= 0 ? newIndex : MESSAGES.length - 1)
  }, [progress])

  const normalizeCourse = (course) => {
    if (!course) return null
    
    if (!course.slug && !course._id) {
      console.error('❌ Curso sem slug ou ID:', course)
      return null
    }
    
    const slug = typeof course.slug === 'object' 
      ? course.slug?.current 
      : course.slug

    return {
      ...course,
      id: course.id || course._id,
      slug: slug || course._id,
      url: course.url || `/curso/${slug || course._id}`,
      totalLessons: course.totalLessons || 0,
      totalExercises: course.totalExercises || 0,
      provider: course.provider || 'openai',
      tags: course.tags || [],
      category: course.category || null,
      subcategory: course.subcategory || null,
      _createdAt: course._createdAt || new Date().toISOString(),
      _updatedAt: course._updatedAt || new Date().toISOString(),
    }
  }

  useEffect(() => {
    if (!payload || createdRef.current) return
    createdRef.current = true

    const criarCurso = async () => {
      try {
        console.log('🚀 Iniciando geração do curso com payload:', payload)
        
        const result = await generateCourse(payload)

        if (result?.success && result?.course) {
          console.log('✅ Curso gerado com sucesso:', result.course)
          
          const normalizedCourse = normalizeCourse(result.course)
          
          if (!normalizedCourse) {
            throw new Error('Falha ao normalizar o curso retornado')
          }
          
          addCourse(normalizedCourse)
          resetCourse()
          setGeneratedCourse(normalizedCourse)

          setProgress(100)
          setMessageIndex(MESSAGES.length - 1)

          const redirectUrl = normalizedCourse.url || `/curso/${normalizedCourse.slug}`

          console.log('📍 Redirecionando para:', redirectUrl)

          setTimeout(() => {
            navigate(redirectUrl)
          }, 800)

        } else {
          throw new Error(result?.error || 'Estrutura de retorno inválida da API')
        }
      } catch (err) {
        console.error('❌ Erro na criação do curso:', err)
        setError(err.message || 'Erro ao gerar curso. Tente novamente.')
        setProgress(100)
        setMessageIndex(MESSAGES.length - 1)
      }
    }

    const timeoutId = setTimeout(() => {
      criarCurso()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [payload, navigate, addCourse, resetCourse])

  const handleRetry = () => {
    createdRef.current = false
    setProgress(0)
    setMessageIndex(0)
    setError(null)
    setGeneratedCourse(null)
    
    setTimeout(() => {
      const criarCurso = async () => {
        try {
          const result = await generateCourse(payload)
          if (result?.success && result?.course) {
            const normalizedCourse = normalizeCourse(result.course)
            if (normalizedCourse) {
              addCourse(normalizedCourse)
              resetCourse()
              const redirectUrl = normalizedCourse.url || `/curso/${normalizedCourse.slug}`
              navigate(redirectUrl)
            }
          }
        } catch (err) {
          setError(err.message || 'Erro ao gerar curso.')
        }
      }
      criarCurso()
    }, 500)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  const handleViewCourse = () => {
    if (generatedCourse) {
      const redirectUrl = generatedCourse.url || `/curso/${generatedCourse.slug}`
      navigate(redirectUrl)
    }
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

      {generatedCourse && error && (
        <Alert 
          severity="success"
          sx={{ 
            width: '100%', 
            maxWidth: 400,
            mb: 2 
          }}
        >
          Curso gerado com sucesso! Houve um problema no redirecionamento automático.
        </Alert>
      )}

      <Typography variant="h5" component="h1">
        {error 
          ? (generatedCourse ? 'Redirecionamento Falhou' : 'Erro na criação do curso')
          : 'Gerando seu curso personalizado...'
        }
      </Typography>

      {(!error || generatedCourse) && (
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

      <Typography variant="body1" color="text.secondary">
        {error 
          ? (generatedCourse 
              ? 'Clique em "Ver Curso" para acessar manualmente.' 
              : 'Tente novamente ou verifique o console.'
            )
          : MESSAGES[messageIndex]
        }
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        {error && !generatedCourse && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleRetry}
            disableElevation
          >
            Tentar Novamente
          </Button>
        )}
        
        {error && generatedCourse && (
          <Button 
            variant="contained" 
            color="success"
            onClick={handleViewCourse}
            disableElevation
          >
            Ver Curso Gerado
          </Button>
        )}
        
        {error && (
          <Button 
            variant="outlined"
            onClick={handleGoHome}
            disableElevation
          >
            Voltar para Início
          </Button>
        )}
      </Box>

      {(!error || generatedCourse) && (
        <Typography variant="body2" color="primary.main" fontWeight="bold">
          {progress}%
        </Typography>
      )}

      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            <strong>Debug Info:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Payload: {payload ? '✅' : '❌'}
          </Typography>
          {generatedCourse && (
            <>
              <Typography variant="caption" color="text.secondary" display="block">
                ID: {generatedCourse.id}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Provider: {generatedCourse.provider}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Tags: {generatedCourse.tags?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Aulas: {generatedCourse.totalLessons} | Exercícios: {generatedCourse.totalExercises}
              </Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  )
}

export default GeneratingCourse