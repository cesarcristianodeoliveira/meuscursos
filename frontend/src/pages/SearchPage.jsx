import React, { useState, useEffect, useCallback } from 'react'
import { 
  Box, 
  Typography,
  Toolbar,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  TextField
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { useCourse } from '../context/CourseContext'
import { useNavigate, useLocation } from 'react-router-dom'

const SearchPage = () => {
  const { courses } = useCourse()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)

  // Recebe o parâmetro inicial da navegação
  useEffect(() => {
    if (location.state?.initialSearch) {
      setSearchTerm(location.state.initialSearch)
    }
  }, [location.state])

  // Função para pesquisar nos cursos - useCallback para evitar recriações desnecessárias
  const searchCourses = useCallback((term) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    
    const lowerTerm = term.toLowerCase()
    
    const results = courses.filter(course => {
      // Pesquisa no título
      if (course.title?.toLowerCase().includes(lowerTerm)) return true
      
      // Pesquisa na descrição
      if (course.description?.toLowerCase().includes(lowerTerm)) return true
      
      // Pesquisa na categoria
      if (course.category?.title?.toLowerCase().includes(lowerTerm)) return true
      
      // Pesquisa na subcategoria
      if (course.subcategory?.title?.toLowerCase().includes(lowerTerm)) return true
      
      // Pesquisa nas tags
      if (course.tags?.some(tag => tag.title?.toLowerCase().includes(lowerTerm))) return true
      
      // Pesquisa no nível
      if (course.level?.toLowerCase().includes(lowerTerm)) return true
      
      return false
    })

    setSearchResults(results)
    setLoading(false)
  }, [courses])

  // Debounce para pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCourses(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, searchCourses]) // Agora inclui searchCourses nas dependências

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

  return (
    <Box 
      sx={{ 
        width: '100%',
        px: [1],
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <Toolbar sx={{ px: [0], minHeight: '56px!important' }} />
      
      <Typography component="h2" variant="h6" sx={{ my: 1.5, lineHeight: 1 }}>
        Pesquisar
      </Typography>

      {/* Campo de pesquisa */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Pesquisar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ 
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />

      {/* Resultados */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={40} />
        </Box>
      )}

      {searchTerm && !loading && searchResults.length === 0 && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2,
          }}
        >
          Nenhum curso encontrado para "<strong>{searchTerm}</strong>"
        </Alert>
      )}

      {!searchTerm && !loading && (
        <Alert 
          severity="info"
          sx={{ 
            mb: 2,
          }}
        >
          Digite algo para pesquisar cursos. Você pode pesquisar por título, descrição, categoria, tags ou nível.
        </Alert>
      )}

      {/* Grid de resultados */}
      {searchResults.length > 0 && (
        <>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3,
              color: 'text.primary',
              fontWeight: 500
            }}
          >
            {searchResults.length} curso(s) encontrado(s) para "{searchTerm}"
          </Typography>

          <Grid container spacing={3}>
            {searchResults.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleCourseClick(course)}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      p: 2
                    }}
                  >
                    <CardContent sx={{ p: 0, width: '100%' }}>
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
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '4.5em'
                        }}
                      >
                        {course.description || 'Sem descrição disponível.'}
                      </Typography>

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

                      {(course.category || course.subcategory) && (
                        <Box sx={{ mb: 1 }}>
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

                      {course.tags && course.tags.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            <strong>Tags:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {course.tags.slice(0, 4).map((tag) => (
                              <Chip
                                key={tag._id}
                                label={tag.title}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 24
                                }}
                              />
                            ))}
                            {course.tags.length > 4 && (
                              <Chip
                                label={`+${course.tags.length - 4}`}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  height: 24
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  )
}

export default SearchPage