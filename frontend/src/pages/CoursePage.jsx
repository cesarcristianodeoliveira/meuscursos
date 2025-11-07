import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  RadioGroup,
  FormControlLabel,
  Radio,
  Toolbar,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { getCourseBySlug } from '../services/api'

const CoursePage = () => {
  const { slug } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getCourseBySlug(slug)
        const courseData = data?.course || data
        if (!courseData || !courseData.title) throw new Error('Curso não encontrado')
        setCourse(courseData)
      } catch (err) {
        console.error('❌ Erro ao carregar curso:', err)
        setError('Curso não encontrado ou inválido.')
      } finally {
        setLoading(false)
      }
    }
    if (slug) loadCourse()
  }, [slug])

  const handleAnswer = (lessonKey, exerciseKey, value) => {
    setAnswers(prev => ({
      ...prev,
      [`${lessonKey}-${exerciseKey}`]: value,
    }))
  }

  if (loading) {
    return (
      <Box 
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          minHeight: '100dvh',
        }}
      >
        <Toolbar sx={{ px: [0], minHeight: '56px!important' }} />
        <CircularProgress />
        <Typography variant='caption' color='textSecondary' sx={{ mt: 2 }}>Carregando curso...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', m: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!course) {
    return (
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Alert severity="warning">Curso não encontrado.</Alert>
      </Box>
    )
  }

  return (
    <>
      <Toolbar sx={{ px: [0], minHeight: '56px!important' }} />
      <Box sx={{ p: [1] }}>

        {/* Título */}
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          {course.title}
        </Typography>

        {/* Subtítulo */}
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1 }}>
          {`${course.category?.title || 'Sem categoria'} • ${course.level || 'Nível não definido'}${
            course.duration ? ` • ${course.duration}h` : ''
          }`}
        </Typography>

        {/* Tags */}
        {course.tags?.length > 0 && (
          <Box>
            {course.tags.map(tag => (
              <Chip
                key={tag._id || tag.title}
                label={tag.title || 'Tag'}
                sx={{ mr: 1 }}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Box>

      <Divider />
      <Box sx={{ px: [1], pt: [1] }}>

        {/* Descrição */}
        <Typography 
          variant="body1" 
          sx={{ mb: [1], lineHeight: 1.8, whiteSpace: 'pre-line' }}
        >
          {course.description || 'Este curso ainda não possui descrição.'}
        </Typography>

      </Box>
      <Box>

        {/* Módulos */}
        {course.modules?.length ? (
          course.modules.map(module => (
            <Accordion key={module._key}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}
                sx={{
                  '&.MuiAccordionDetails-root': {
                    px: [1],
                    boxShadow: 'none'
                  },
                  '&.MuiAccordionSummary-root': {
                    p: '0 8px'
                  }
                }}
              >
                <Typography variant="h6">
                  {module.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  p: [1],
                  '.MuiPaper-root-MuiAccordion-root': {
                    boxShadow: 'none!important'
                  }
                }}
              >
                <Typography variant="body2">
                  {module.description}
                </Typography>

                {module.lessons?.map(lesson => (
                  <Box key={lesson._key}>
                      {/* Título da lição */}
                      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                        {lesson.title}
                      </Typography>
                      
                      {/* Conteúdo */}
                      <Typography 
                        variant="body2" 
                        sx={{ whiteSpace: 'pre-line', mb: 2 }}
                      >
                        {lesson.content}
                      </Typography>

                      {/* Dicas */}
                      {lesson.tips?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            💡 Dicas:
                          </Typography>
                          <List dense>
                            {lesson.tips.map((tip, i) => (
                              <ListItem key={i} sx={{ pl: 0 }}>
                                <ListItemText primary={tip} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {/* Exercícios */}
                      {lesson.exercises?.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            🧩 Exercícios:
                          </Typography>
                          {lesson.exercises.map(ex => {
                            const key = `${lesson._key}-${ex._key}`
                            const userAnswer = answers[key]
                            const isCorrect = userAnswer === ex.answer

                            return (
                              <Box
                                key={ex._key}
                              >
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                  {ex.question}
                                </Typography>
                                <RadioGroup
                                  value={userAnswer || ''}
                                  onChange={e => handleAnswer(lesson._key, ex._key, e.target.value)}
                                >
                                  {ex.options.map(opt => (
                                    <FormControlLabel
                                      key={opt}
                                      value={opt}
                                      control={<Radio />}
                                      label={opt}
                                    />
                                  ))}
                                </RadioGroup>
                                {userAnswer && (
                                  <Typography
                                    sx={{
                                      mt: 1,
                                      color: isCorrect ? 'success.main' : 'error.main',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    {isCorrect ? (
                                      <>
                                        <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                                        Correto!
                                      </>
                                    ) : (
                                      '❌ Resposta incorreta'
                                    )}
                                  </Typography>
                                )}
                              </Box>
                            )
                          })}
                        </Box>
                      )}
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Alert severity="info">Este curso ainda não possui módulos.</Alert>
        )}
      </Box>
    </>
  )
}

export default CoursePage