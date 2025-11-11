import React, { useMemo } from 'react'
import { 
  Box, 
  Typography,
  Toolbar,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  CircularProgress,
  Grid
} from '@mui/material'
import { useCourse } from '../context/CourseContext'
import { useNavigate } from 'react-router-dom'

const CoursesPage = () => {
  const { courses, loading } = useCourse()
  const navigate = useNavigate()

  // ✅ Ordena cursos do mais novo para o mais antigo
  const sortedCourses = useMemo(() => {
    if (!courses || courses.length === 0) return []
    return [...courses].sort((a, b) => {
      const dateA = new Date(a._createdAt || 0)
      const dateB = new Date(b._createdAt || 0)
      return dateB - dateA // Descendente (mais novo primeiro)
    })
  }, [courses])

  const handleCourseClick = (course) => {
    navigate(`/curso/${course.slug}`)
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'success'
      case 'intermediate': return 'warning'
      case 'advanced': return 'error'
      default: return 'default'
    }
  }

  const getLevelText = (level) => {
    switch (level) {
      case 'beginner': return 'Iniciante'
      case 'intermediate': return 'Intermediário'
      case 'advanced': return 'Avançado'
      default: return level
    }
  }

  const formatDuration = (minutes) => {
    if (!minutes) return 'Duração não informada'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`.trim()
    }
    return `${mins} min`
  }

  const countTotalLessons = (course) => {
    if (!course.modules) return 0
    return course.modules.reduce((total, module) => {
      return total + (module.lessons?.length || 0)
    }, 0)
  }

  const countTotalExercises = (course) => {
    if (!course.modules) return 0
    return course.modules.reduce((total, module) => {
      const moduleExercises = module.lessons?.reduce((lessonTotal, lesson) => {
        return lessonTotal + (lesson.exercises?.length || 0)
      }, 0) || 0
      return total + moduleExercises
    }, 0)
  }

  if (loading) {
    return (
      <Box sx={{ width: '100%', px: [1] }}>
        <Toolbar sx={{ px: [0], minHeight: '56px!important' }} />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100dvh">
          <CircularProgress size={60} />
        </Box>
      </Box>
    )
  }

  return (
    <Box 
      sx={{ 
        width: '100%',
        px: [1],
        minHeight: '100dvh',
        bgcolor: 'background.default'
      }}
    >
      <Toolbar sx={{ px: [0], minHeight: '56px!important' }} />
      
      <Typography component="h2" variant="h6" sx={{ my: 1.5, lineHeight: 1 }}>
        Cursos
      </Typography>

      {sortedCourses.length === 0 ? (
        <Typography 
          color='text.secondary'
          sx={{ fontSize: '0.875rem' }}
        >
          Nenhum curso no momento
        </Typography>
      ) : (
        <Grid container spacing={1}>
          {sortedCourses.map((course) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={course._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardActionArea 
                  onClick={() => handleCourseClick(course)}
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 1,
                    height: '100%',
                    flex: 1
                  }}
                >
                  <CardContent 
                    sx={{ 
                      p: 0, 
                      width: '100%', 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column' 
                    }}
                  >
                    {/* Título */}
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        lineHeight: 1.3,
                        minHeight: '3.9em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {course.title}
                    </Typography>
                    
                    {/* Descrição */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '4.5em',
                        flex: 1
                      }}
                    >
                      {course.description || 'Sem descrição disponível.'}
                    </Typography>

                    {/* Chips de nível e duração */}
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip 
                        label={getLevelText(course.level)} 
                        size="small" 
                        color={getLevelColor(course.level)}
                        variant="filled"
                      />
                      {course.duration && (
                        <Chip 
                          label={formatDuration(course.duration)} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {/* Estatísticas */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>{countTotalLessons(course)}</strong> aulas
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <strong>{countTotalExercises(course)}</strong> exercícios
                      </Typography>
                    </Box>

                    {/* Categoria e Subcategoria */}
                    {(course.category || course.subcategory) && (
                      <Box sx={{ mb: 2 }}>
                        {course.category && (
                          <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                            <strong>Categoria:</strong> {course.category.title}
                          </Typography>
                        )}
                        {course.subcategory && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            <strong>Subcategoria:</strong> {course.subcategory.title}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Tags */}
                    {course.tags && course.tags.length > 0 && (
                      <Box sx={{ mt: 'auto', pt: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          <strong>Tags:</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {course.tags.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag._id}
                              label={tag.title}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                          ))}
                          {course.tags.length > 3 && (
                            <Chip
                              label={`+${course.tags.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Provider */}
                    {course.provider && (
                      <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Fonte:</strong> {course.provider}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default CoursesPage
