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
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  RadioGroup,
  FormControlLabel,
  Radio,
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
    return React.createElement(
      Box,
      { sx: { textAlign: 'center', mt: 6 } },
      React.createElement(CircularProgress, null),
      React.createElement(Typography, { sx: { mt: 2 } }, 'Carregando curso...')
    )
  }

  if (error) {
    return React.createElement(
      Box,
      { sx: { textAlign: 'center', m: 2 } },
      React.createElement(Alert, { severity: 'error' }, error)
    )
  }

  if (!course) {
    return React.createElement(
      Box,
      { sx: { textAlign: 'center', mt: 6 } },
      React.createElement(Alert, { severity: 'warning' }, 'Curso não encontrado.')
    )
  }

  return React.createElement(
    Box,
    { sx: { maxWidth: 900, mx: 'auto', mt: 5, px: 2, pb: 6 } },
    // Título
    React.createElement(
      Typography,
      { variant: 'h4', sx: { mb: 1, fontWeight: 700 } },
      course.title
    ),

    // Subtítulo
    React.createElement(
      Typography,
      { variant: 'subtitle1', sx: { color: 'text.secondary', mb: 3 } },
      `${course.category?.title || 'Sem categoria'} • ${course.level || 'Nível não definido'}${
        course.duration ? ` • ${course.duration}h` : ''
      }`
    ),

    React.createElement(Divider, { sx: { mb: 3 } }),

    // Descrição
    React.createElement(
      Typography,
      { variant: 'body1', sx: { mb: 3, lineHeight: 1.8, whiteSpace: 'pre-line' } },
      course.description || 'Este curso ainda não possui descrição.'
    ),

    // Tags
    course.tags?.length > 0 &&
      React.createElement(
        Box,
        { sx: { mb: 4 } },
        course.tags.map(tag =>
          React.createElement(Chip, {
            key: tag._id || tag.title,
            label: tag.title || 'Tag',
            sx: { mr: 1, mb: 1 },
            color: 'primary',
            variant: 'outlined',
          })
        )
      ),

    // Módulos
    course.modules?.length
      ? course.modules.map(module =>
          React.createElement(
            Accordion,
            { key: module._key, sx: { mb: 2 } },
            React.createElement(
              AccordionSummary,
              { expandIcon: React.createElement(ExpandMoreIcon, null) },
              React.createElement(
                Typography,
                { variant: 'h6', sx: { fontWeight: 600 } },
                module.title
              )
            ),
            React.createElement(
              AccordionDetails,
              null,
              React.createElement(
                Typography,
                { variant: 'body2', sx: { mb: 2, color: 'text.secondary' } },
                module.description
              ),

              module.lessons?.map(lesson =>
                React.createElement(
                  Card,
                  { key: lesson._key, sx: { mb: 3, boxShadow: 1 } },
                  React.createElement(
                    CardContent,
                    null,
                    // Título da lição
                    React.createElement(
                      Typography,
                      { variant: 'h6', sx: { mb: 1 } },
                      lesson.title
                    ),
                    // Conteúdo
                    React.createElement(
                      Typography,
                      { variant: 'body2', sx: { whiteSpace: 'pre-line', mb: 2 } },
                      lesson.content
                    ),

                    // Dicas
                    lesson.tips?.length > 0 &&
                      React.createElement(
                        Box,
                        { sx: { mb: 2 } },
                        React.createElement(
                          Typography,
                          { variant: 'subtitle2', sx: { fontWeight: 600, mb: 1 } },
                          '💡 Dicas:'
                        ),
                        React.createElement(
                          List,
                          { dense: true },
                          lesson.tips.map((tip, i) =>
                            React.createElement(
                              ListItem,
                              { key: i, sx: { pl: 0 } },
                              React.createElement(ListItemText, { primary: tip })
                            )
                          )
                        )
                      ),

                    // Exercícios
                    lesson.exercises?.length > 0 &&
                      React.createElement(
                        Box,
                        { sx: { mt: 2 } },
                        React.createElement(
                          Typography,
                          { variant: 'subtitle2', sx: { fontWeight: 600, mb: 1 } },
                          '🧩 Exercícios:'
                        ),
                        lesson.exercises.map(ex => {
                          const key = `${lesson._key}-${ex._key}`
                          const userAnswer = answers[key]
                          const isCorrect = userAnswer === ex.answer

                          return React.createElement(
                            Box,
                            {
                              key: ex._key,
                              sx: {
                                mb: 2,
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid #ddd',
                                bgcolor: isCorrect ? 'success.light' : 'background.paper',
                              },
                            },
                            React.createElement(
                              Typography,
                              { variant: 'body1', sx: { mb: 1 } },
                              ex.question
                            ),
                            React.createElement(
                              RadioGroup,
                              {
                                value: userAnswer || '',
                                onChange: e => handleAnswer(lesson._key, ex._key, e.target.value),
                              },
                              ex.options.map(opt =>
                                React.createElement(FormControlLabel, {
                                  key: opt,
                                  value: opt,
                                  control: React.createElement(Radio, null),
                                  label: opt,
                                })
                              )
                            ),
                            userAnswer &&
                              React.createElement(
                                Typography,
                                {
                                  sx: {
                                    mt: 1,
                                    color: isCorrect ? 'success.main' : 'error.main',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                  },
                                },
                                isCorrect
                                  ? React.createElement(
                                      React.Fragment,
                                      null,
                                      React.createElement(CheckCircleIcon, {
                                        sx: { mr: 1, fontSize: 20 },
                                      }),
                                      'Correto!'
                                    )
                                  : '❌ Resposta incorreta'
                              )
                          )
                        })
                      )
                  )
                )
              )
            )
          )
        )
      : React.createElement(Alert, { severity: 'info' }, 'Este curso ainda não possui módulos.')
  )
}

export default CoursePage
