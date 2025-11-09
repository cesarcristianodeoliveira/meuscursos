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

// 🔄 CONSTANTES FORA DO COMPONENTE - Resolve permanentemente os warnings
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

  // Simula a barra de progresso
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(old => {
        if (old >= 95) return 95 // Para em 95% até a API responder
        return old + 4
      })
    }, 400)
    return () => clearInterval(timer)
  }, [])

  // Atualiza mensagens conforme progresso - CORRIGIDO
  useEffect(() => {
    const thresholds = [15, 30, 50, 70, 85, 95]
    const newIndex = thresholds.findIndex(threshold => progress < threshold)
    setMessageIndex(newIndex >= 0 ? newIndex : MESSAGES.length - 1)
  }, [progress]) // ✅ Só depende de progress agora

  // Cria o curso e redireciona - CORRIGIDO
  useEffect(() => {
    if (!payload || createdRef.current) return
    createdRef.current = true

    const criarCurso = async () => {
      try {
        console.log('🚀 Iniciando geração do curso com payload:', payload)
        
        const result = await generateCourse(payload)

        if (result?.success && result?.course) {
          console.log('✅ Curso gerado com sucesso:', result.course)
          
          const normalizedCourse = {
            ...result.course,
            slug: typeof result.course.slug === 'object'
              ? result.course.slug.current
              : result.course.slug,
          }

          addCourse(normalizedCourse)
          resetCourse()
          setGeneratedCourse(normalizedCourse)

          // Completa a barra de progresso
          setProgress(100)
          setMessageIndex(MESSAGES.length - 1)

          // 🔄 REDIRECIONAMENTO CORRIGIDO - Usa a URL completa do backend
          const redirectUrl = result.course.url || 
            (result.course.category?.slug && result.course.subcategory?.slug 
              ? `/${result.course.category.slug}/${result.course.subcategory.slug}/${normalizedCourse.slug}`
              : `/curso/${normalizedCourse.slug}`)

          console.log('📍 Redirecionando para:', redirectUrl)

          // Redireciona após um breve delay para mostrar 100%
          setTimeout(() => {
            navigate(redirectUrl)
          }, 800)

        } else {
          throw new Error(result?.error || 'Estrutura de retorno inválida da API')
        }
      } catch (err) {
        console.error('❌ Erro na criação do curso:', err)
        setError(err.message || 'Erro ao gerar curso. Tente novamente.')
        setProgress(100) // Mostra 100% mesmo com erro
        setMessageIndex(MESSAGES.length - 1)
      }
    }

    // Delay inicial para melhor UX
    const timeoutId = setTimeout(() => {
      criarCurso()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [payload, navigate, addCourse, resetCourse]) // ✅ Sem MESSAGES.length

  const handleRetry = () => {
    createdRef.current = false
    setProgress(0)
    setMessageIndex(0)
    setError(null)
    setGeneratedCourse(null)
    
    // Recria o curso
    setTimeout(() => {
      const criarCurso = async () => {
        try {
          const result = await generateCourse(payload)
          if (result?.success && result?.course) {
            const normalizedCourse = {
              ...result.course,
              slug: typeof result.course.slug === 'object'
                ? result.course.slug.current
                : result.course.slug,
            }
            addCourse(normalizedCourse)
            resetCourse()
            
            const redirectUrl = result.course.url || `/curso/${normalizedCourse.slug}`
            navigate(redirectUrl)
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

      {/* Alert de sucesso (se curso foi gerado mas houve erro no redirecionamento) */}
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

      {/* Título */}
      <Typography variant="h5" component="h1">
        {error 
          ? (generatedCourse ? 'Redirecionamento Falhou' : 'Erro na criação do curso')
          : 'Gerando seu curso personalizado...'
        }
      </Typography>

      {/* Barra de progresso (só mostra se não tem erro OU se tem curso gerado) */}
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

      {/* Mensagem */}
      <Typography variant="body1" color="text.secondary">
        {error 
          ? (generatedCourse 
              ? 'Clique em "Ver Curso" para acessar manualmente.' 
              : 'Tente novamente ou verifique o console.'
            )
          : MESSAGES[messageIndex]
        }
      </Typography>

      {/* Botões de ação */}
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

      {/* Percentual (só mostra se não tem erro OU se tem curso gerado) */}
      {(!error || generatedCourse) && (
        <Typography variant="body2" color="primary.main" fontWeight="bold">
          {progress}%
        </Typography>
      )}

      {/* Debug info (apenas desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && generatedCourse && (
        <Typography variant="caption" color="text.secondary">
          ID: {generatedCourse.id} | URL: {generatedCourse.url}
        </Typography>
      )}
    </Box>
  )
}

export default GeneratingCourse