import React, { useState, useMemo, useEffect } from 'react'
import {
  Box, Button, Typography,
  Alert,
  Toolbar, List, ListItemButton, ListItemText, ListItemIcon, Checkbox
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useCourse } from '../context/CourseContext'
import { getTagsBySubcategory } from '../services/api'

const steps = ['Nível', 'Categoria', 'Subcategoria', 'Tags', 'Gerar Curso']

function NewCourseWizard() {
  const navigate = useNavigate()
  const { categories, subcategories, loading } = useCourse()

  const [activeStep, setActiveStep] = useState(0)
  const [level, setLevel] = useState('beginner')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [error, setError] = useState(null)

  // --- subcategorias filtradas pela categoria escolhida
  const filteredSubs = useMemo(
    () => (subcategories || []).filter(
      sub => sub.category?._ref === categoryId || sub.category?._id === categoryId
    ),
    [subcategories, categoryId]
  )

  // --- buscar tags ao mudar de subcategoria
  useEffect(() => {
    const loadTags = async () => {
      if (!subcategoryId) {
        setAvailableTags([])
        return
      }
      setLoadingTags(true)
      try {
        const tags = await getTagsBySubcategory(subcategoryId)
        setAvailableTags(tags)
      } catch (err) {
        console.error('❌ Erro ao carregar tags:', err)
        setAvailableTags([])
      } finally {
        setLoadingTags(false)
      }
    }
    loadTags()
  }, [subcategoryId])

  // --- alternar tags
  const toggleTag = tagId => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  // --- avançar etapas
  const handleNext = () => {
    setError(null)

    // validações básicas
    if (activeStep === 1 && !categoryId) {
      setError('Selecione uma categoria antes de continuar.')
      return
    }
    if (activeStep === 2 && !subcategoryId) {
      setError('Selecione uma subcategoria antes de continuar.')
      return
    }
    if (activeStep === 3 && availableTags.length > 0 && selectedTags.length === 0) {
      setError('Selecione pelo menos uma tag antes de continuar.')
      return
    }

    // último passo → gerar curso
    if (activeStep === steps.length - 1) {
      const payload = { categoryId, subcategoryId, level, tags: selectedTags }
      navigate('/curso/gerando', { state: { payload } })
      return
    }

    // próximo passo normal
    setActiveStep(prev => prev + 1)
  }

  // --- voltar etapa
  const handleBack = () => setActiveStep(prev => prev - 1)

  // --- Opções para cada passo
  const levelOptions = [
    { value: 'beginner', label: 'Iniciante' },
    { value: 'intermediate', label: 'Intermediário' },
    { value: 'advanced', label: 'Avançado' }
  ]

  // --- renderizar conteúdo de cada passo
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <List sx={{ width: '100%' }}>
            {levelOptions.map(option => (
              <ListItemButton
                key={option.value}
                selected={level === option.value}
                onClick={() => setLevel(option.value)}
                sx={{
                  px: [1]
                }}
              >
                <ListItemText 
                  primary={option.label}
                />
              </ListItemButton>
            ))}
          </List>
        )

      case 1:
        return Array.isArray(categories) && categories.length ? (
          <List sx={{ width: '100%' }}>
            {categories.map(cat => (
              <ListItemButton
                key={cat._id}
                selected={categoryId === cat._id}
                onClick={() => {
                  setCategoryId(cat._id)
                  setSubcategoryId('')
                  setSelectedTags([])
                  setAvailableTags([])
                }}
                sx={{
                  px: [1]
                }}
              >
                <ListItemText 
                  primary={cat.title}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Typography sx={{ mt: 2, px: [1] }}>
            {loading ? 'Carregando categorias...' : 'Nenhuma categoria disponível.'}
          </Typography>
        )

      case 2:
        return !filteredSubs.length ? (
          <Typography sx={{ mt: 2 }}>Nenhuma subcategoria disponível.</Typography>
        ) : (
          <List sx={{ width: '100%' }}>
            {filteredSubs.map(sub => (
              <ListItemButton
                key={sub._id}
                selected={subcategoryId === sub._id}
                onClick={() => {
                  setSubcategoryId(sub._id)
                  setSelectedTags([])
                }}
                sx={{
                  px: [1]
                }}
              >
                <ListItemText 
                  primary={sub.title}
                />
              </ListItemButton>
            ))}
          </List>
        )

      // --- passo: seleção de tags (estilo oficial Material-UI) ---
      case 3:
        if (loadingTags)
          return <Typography sx={{ width: '100%', mt: 2, px: [1] }}>Carregando tags...</Typography>

        if (!availableTags.length)
          return <Typography sx={{ mt: 2 }}>Nenhuma tag disponível para esta subcategoria.</Typography>

        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ width: '100%', px: [1] }}>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Selecione as tags relacionadas
              </Typography>
            </Box>
            <List dense sx={{ width: '100%' }}>
              {availableTags.map(tag => {
                const labelId = `checkbox-tag-label-${tag._id}`;
                
                return (
                  <ListItemButton
                    key={tag._id}
                    role={undefined}
                    onClick={() => toggleTag(tag._id)}
                    dense
                    sx={{
                      px: [1]
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        '&.MuiListItemIcon-root': {
                          minWidth: 'auto',
                        }
                      }}
                    >
                      <Checkbox
                        edge="start"
                        checked={selectedTags.includes(tag._id)}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      id={labelId} 
                      primary={tag.title}
                    />
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        )

      case 4:
        return (
          <Box sx={{ width: '100%', px: [1] }}>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Pronto para gerar seu curso?
            </Typography>
            <Typography variant="body2" color="textSecondary">
              O conteúdo será gerado automaticamente com base nas opções selecionadas.
            </Typography>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100dvh', // Altura total da viewport
          overflow: 'hidden', // Remove scroll geral
        }}
      >
        <Toolbar sx={{ px: 0, minHeight: '56px!important' }} />
        
        {/* Cabeçalho */}
        <Box
          sx={{
            width: '100%',
            pt: 1,
            px: 1,
            flexShrink: 0, // Não encolhe
          }}
        >
          <Typography variant="h6">
            Criar Novo Curso
          </Typography>
          <Typography variant="body1">
            Siga o passo a passo para configurar seu curso.
          </Typography>
        </Box>
        
        {/* Área de Alertas */}
        {error && (
          <Box sx={{ flexShrink: 0, width: '100%', px: 1 }}>
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          </Box>
        )}
        
        {/* Conteúdo com Scroll */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          width: '100%',
        }}>
          {renderStepContent()}
        </Box>
        
        {/* Botões Fixos no Bottom */}
        <Box sx={{ 
          flexShrink: 0, // Não encolhe
          display: 'flex', 
          width: '100%', 
          justifyContent: activeStep === 0 ? 'flex-end' : 'space-between', 
          p: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper' // Garante fundo sólido
        }}>
          {activeStep === 0 ? (
            null
          ) : (
            <Button 
              disabled={activeStep === 0} 
              onClick={handleBack} 
              variant="outlined"
              disableElevation
              sx={{
                transition: 'none'
              }}
            >
              Voltar
            </Button>
          )}
          
          <Button
            variant="contained"
            onClick={handleNext}
            disableElevation
            disabled={
              (activeStep === 1 && !categoryId) ||
              (activeStep === 2 && !subcategoryId)
            }
            sx={{
              transition: 'none'
            }}
          >
            {activeStep === steps.length - 1 ? 'Gerar Curso' : 'Próximo'}
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default NewCourseWizard