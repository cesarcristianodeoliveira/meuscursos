import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Box, Button, Typography,
  Alert,
  Toolbar, List, ListItemButton, ListItemText, ListItemIcon, Checkbox,
  RadioGroup, Radio, FormControlLabel, FormControl
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useCourse } from '../context/CourseContext'
import { getTagsBySubcategory } from '../services/api'
import IconResolver from '../components/IconResolver'

const steps = ['Nível', 'Categoria', 'Subcategoria', 'Tags', 'Provider', 'Gerar Curso']

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
  const [provider, setProvider] = useState('')

  const providerOptions = [
    { 
      value: 'openai', 
      label: 'OpenAI GPT-4', 
      description: 'Qualidade superior, ideal para cursos complexos e avançados',
      recommendation: 'Recomendado para cursos avançados'
    },
    { 
      value: 'gemini', 
      label: 'Google Gemini', 
      description: 'Rápido e eficiente, ótimo para cursos introdutórios',
      recommendation: 'Ideal para cursos básicos e intermediários'
    }
  ]

  const contentRef = useRef(null)
  const levelOptions = [
    { value: 'beginner', label: 'Iniciante' },
    { value: 'intermediate', label: 'Intermediário' },
    { value: 'advanced', label: 'Avançado' }
  ]

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeStep])

  const filteredSubs = useMemo(
    () => (subcategories || []).filter(
      sub => sub.category?._ref === categoryId || sub.category?._id === categoryId
    ),
    [subcategories, categoryId]
  )

  useEffect(() => {
    if (categoryId) {
      setSubcategoryId('')
      setSelectedTags([])
      setAvailableTags([])
    }
  }, [categoryId])

  useEffect(() => {
    if (subcategoryId) {
      setSelectedTags([])
    }
  }, [subcategoryId])

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

  const toggleTag = tagId => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleNext = () => {
    setError(null)

    if (activeStep === 1 && !categoryId) {
      setError('Selecione uma categoria antes de continuar.')
      return
    }
    if (activeStep === 2 && !subcategoryId) {
      setError('Selecione uma subcategoria antes de continuar.')
      return
    }
    if (activeStep === 3 && (selectedTags.length === 0 || selectedTags.length > 3)) {
      setError('Selecione entre 1 e 3 tags antes de continuar.')
      return
    }
    if (activeStep === 4 && !provider) {
      setError('Selecione um provider de IA antes de continuar.')
      return
    }

    if (activeStep === steps.length - 1) {
      const payload = { 
        categoryId, 
        subcategoryId, 
        level, 
        tags: selectedTags,
        provider
      }
      
      // 👇 DEBUG CRÍTICO - Verifica se o payload está correto
      console.log('🎯 DEBUG CRÍTICO - Payload antes de navegar:', JSON.stringify(payload, null, 2))
      console.log('🔍 DEBUG - Provider selecionado:', provider)
      console.log('🔍 DEBUG - Tem categoryId?', !!categoryId)
      console.log('🔍 DEBUG - Tem subcategoryId?', !!subcategoryId)
      console.log('🔍 DEBUG - Tem tags?', selectedTags.length)
      
      navigate('/curso/gerando', { 
        state: { 
          payload,
          categoryId,
          subcategoryId
        } 
      })
      return
    }

    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => setActiveStep(prev => prev - 1)

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
                sx={{ px: [1] }}
              >
                <ListItemText primary={option.label} />
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
                sx={{ px: [1] }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                  <IconResolver iconName={cat.icon} />
                </ListItemIcon>
                <ListItemText primary={cat.title} />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Typography color='textSecondary' fontSize='small' sx={{ mt: 2, px: [1] }}>
            {loading ? 'Carregando categorias...' : 'Nenhuma categoria disponível'}
          </Typography>
        )

      case 2:
        return !filteredSubs.length ? (
          <Typography color='textSecondary' fontSize='small' sx={{ mt: 2, px: [1] }}>
            Nenhuma subcategoria disponível
          </Typography>
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
                sx={{ px: [1] }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                  <IconResolver iconName={sub.icon} />
                </ListItemIcon>
                <ListItemText primary={sub.title} />
              </ListItemButton>
            ))}
          </List>
        )

      case 3:
        if (loadingTags)
          return <Typography sx={{ width: '100%', mt: 2, px: [1] }}>Carregando tags...</Typography>

        if (!availableTags.length)
          return <Typography sx={{ mt: 2 }}>Nenhuma tag disponível para esta subcategoria.</Typography>

        const maxTags = 3
        const reachedMax = selectedTags.length >= maxTags

        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ width: '100%', px: [1] }}>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Selecione as tags relacionadas ({selectedTags.length}/{maxTags})
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Selecione no mínimo 1 e no máximo {maxTags} tags
              </Typography>
            </Box>
            <List dense sx={{ width: '100%' }}>
              {availableTags.map(tag => {
                const labelId = `checkbox-tag-label-${tag._id}`
                const isSelected = selectedTags.includes(tag._id)
                const isDisabled = reachedMax && !isSelected

                return (
                  <ListItemButton
                    key={tag._id}
                    role={undefined}
                    onClick={() => !isDisabled && toggleTag(tag._id)}
                    dense
                    disabled={isDisabled}
                    sx={{
                      px: [1],
                      opacity: isDisabled ? 0.5 : 1,
                      '&.Mui-disabled': { opacity: 0.5 }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 'auto' }}>
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        tabIndex={-1}
                        disableRipple
                        disabled={isDisabled}
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </ListItemIcon>
                    <ListItemText id={labelId} primary={tag.title} />
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        )

      case 4:
        return (
          <Box sx={{ width: '100%', px: [1] }}>
            <Typography variant="h6" sx={{ mt: 2, mb: 3 }}>
              Escolha o Provider de IA
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Selecione qual inteligência artificial irá gerar o conteúdo do seu curso
            </Typography>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                sx={{ gap: 2 }}
              >
                {providerOptions.map((option) => (
                  <Box
                    key={option.value}
                    sx={{
                      border: provider === option.value ? '2px solid' : '1px solid',
                      borderColor: provider === option.value ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      p: 2,
                      backgroundColor: provider === option.value ? 'action.selected' : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <FormControlLabel
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {option.label}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {option.description}
                          </Typography>
                          {level === 'advanced' && option.value === 'openai' && (
                            <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                              ⭐ {option.recommendation}
                            </Typography>
                          )}
                          {level === 'beginner' && option.value === 'gemini' && (
                            <Typography variant="caption" color="info.main" sx={{ mt: 1, display: 'block' }}>
                              💡 {option.recommendation}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{ 
                        width: '100%',
                        m: 0,
                        '& .MuiFormControlLabel-label': { width: '100%' }
                      }}
                    />
                  </Box>
                ))}
              </RadioGroup>
            </FormControl>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" color="info.contrastText">
                <strong>💡 Dica:</strong> {
                  level === 'advanced' 
                    ? 'Para cursos avançados recomendamos OpenAI GPT-4 para melhor qualidade e profundidade.'
                    : level === 'intermediate'
                    ? 'Para cursos intermediários ambos os providers funcionam bem. Gemini é mais rápido.'
                    : 'Para cursos iniciantes o Google Gemini é uma ótima opção por ser rápido e eficiente.'
                }
              </Typography>
            </Box>
          </Box>
        )

      case 5:
        return (
          <Box sx={{ width: '100%', px: [1] }}>
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
              Resumo do Curso
            </Typography>
            
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Nível:</strong> {levelOptions.find(l => l.value === level)?.label}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Categoria:</strong> {categories.find(c => c._id === categoryId)?.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Subcategoria:</strong> {filteredSubs.find(s => s._id === subcategoryId)?.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Tags:</strong> {selectedTags.length} selecionadas
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Provider:</strong> {providerOptions.find(p => p.value === provider)?.label}
              </Typography>
            </Box>
            
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      <Toolbar sx={{ px: 0, minHeight: '56px!important' }} />
      
      <Box sx={{ width: '100%', pt: 1, px: 1, flexShrink: 0 }}>
        <Typography variant="h6">Criar Novo Curso</Typography>
        <Typography variant="body1">Siga o passo a passo para configurar seu curso</Typography>
      </Box>
      
      {error && (
        <Box sx={{ flexShrink: 0, width: '100%', px: 1 }}>
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>
        </Box>
      )}
      
      <Box 
        ref={contentRef}
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          width: '100%',
        }}
      >
        {renderStepContent()}
      </Box>
      
      <Box sx={{ 
        flexShrink: 0,
        display: 'flex', 
        width: '100%', 
        justifyContent: activeStep === 0 ? 'flex-end' : 'space-between', 
        p: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}>
        {activeStep === 0 ? null : (
          <Button 
            onClick={handleBack} 
            variant="outlined"
            disableElevation
            sx={{ transition: 'none' }}
          >
            Voltar
          </Button>
        )}
        
        <Button
          variant="contained"
          onClick={handleNext}
          disableElevation
          disabled={
            (activeStep === 0 && !level) ||
            (activeStep === 1 && !categoryId) ||
            (activeStep === 2 && !subcategoryId) ||
            (activeStep === 3 && (selectedTags.length === 0 || selectedTags.length > 3)) ||
            (activeStep === 4 && !provider)
          }
          sx={{ transition: 'none' }}
        >
          {activeStep === steps.length - 1 ? 'Gerar Curso' : 'Próximo'}
        </Button>
      </Box>
    </Box>
  )
}

export default NewCourseWizard