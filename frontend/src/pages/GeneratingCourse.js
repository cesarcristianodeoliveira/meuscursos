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
  const [isGenerating, setIsGenerating] = useState(false)

  // 👇 DEBUG CRÍTICO - Verifica se o payload chegou
  console.log('🎯 DEBUG CRÍTICO - GeneratingCourse montado')
  console.log('🔍 DEBUG - Location.state completo:', location.state)
  console.log('🔍 DEBUG - Payload recebido:', payload)
  console.log('🔍 DEBUG - Tem payload?', !!payload)
  console.log('🔍 DEBUG - Provider no payload:', payload?.provider)

  // 👇 PROGRESSO AUTOMÁTICO
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(old => {
        if (old >= 95) return 95
        return old + 4
      })
    }, 400)
    return () => clearInterval(timer)
  }, [])

  // 👇 ATUALIZA MENSAGENS CONFORME PROGRESSO
  useEffect(() => {
    const thresholds = [15, 30, 50, 70, 85, 95]
    const newIndex = thresholds.findIndex(threshold => progress < threshold)
    setMessageIndex(newIndex >= 0 ? newIndex : MESSAGES.length - 1)
  }, [progress])

  // 👇 NORMALIZA CURSO
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

  // 👇 EFEITO PRINCIPAL COM TIMEOUT DE SEGURANÇA
  useEffect(() => {
    console.log('🔍 DEBUG - useEffect principal executando')
    console.log('🔍 DEBUG - Payload disponível?', !!payload)
    console.log('🔍 DEBUG - Já criado?', createdRef.current)
    console.log('🔍 DEBUG - Está gerando?', isGenerating)
    
    if (!payload || createdRef.current || isGenerating) {
      console.log('🔍 DEBUG - Condições não atendidas, saindo...')
      return
    }
    
    createdRef.current = true
    setIsGenerating(true)
    console.log('🔍 DEBUG - Iniciando geração do curso...')

    // 👇 TIMEOUT DE SEGURANÇA (45 segundos)
    const safetyTimeout = setTimeout(() => {
      if (!generatedCourse && !error) {
        console.log('⏰ Timeout de segurança - API não respondeu em 45s')
        setError('Tempo limite excedido. A geração está demorando mais que o normal. Tente novamente.')
        setProgress(100)
        setIsGenerating(false)
      }
    }, 45000)

    const criarCurso = async () => {
      try {
        console.log('🚀 Iniciando geração do curso com payload:', payload)
        console.log('🔍 Provider selecionado:', payload.provider)
        
        const result = await generateCourse(payload)
        console.log('🔍 DEBUG - Resultado da API:', result)

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
          setIsGenerating(false)

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
        setIsGenerating(false)
      } finally {
        clearTimeout(safetyTimeout)
      }
    }

    const timeoutId = setTimeout(() => {
      criarCurso()
    }, 1000)

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [payload, navigate, addCourse, resetCourse, generatedCourse, error, isGenerating])

  // 👇 TENTAR NOVAMENTE
  const handleRetry = () => {
    createdRef.current = false
    setProgress(0)
    setMessageIndex(0)
    setError(null)
    setGeneratedCourse(null)
    setIsGenerating(false)
    
    setTimeout(() => {
      const criarCurso = async () => {
        try {
          setIsGenerating(true)
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
          setIsGenerating(false)
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
            disabled={isGenerating}
          >
            {isGenerating ? 'Tentando...' : 'Tentar Novamente'}
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

      {/* 👇 DEBUG INFO MELHORADA */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            <strong>Debug Info:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Payload: {payload ? '✅' : '❌'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Provider: {payload?.provider || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Is Generating: {isGenerating ? '✅' : '❌'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Created Ref: {createdRef.current ? '✅' : '❌'}
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