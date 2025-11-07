import React, { useState, useMemo, useEffect } from 'react'
import {
  Box, Button, Typography, Stepper, Step, StepLabel,
  FormControl, InputLabel, Select, MenuItem, Checkbox,
  FormGroup, FormControlLabel, Alert
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

  // --- renderizar conteúdo de cada passo
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return React.createElement(
          FormControl,
          { fullWidth: true },
          React.createElement(InputLabel, null, 'Nível'),
          React.createElement(
            Select,
            { value: level, label: 'Nível', onChange: e => setLevel(e.target.value) },
            [
              React.createElement(MenuItem, { key: 'b', value: 'beginner' }, 'Iniciante'),
              React.createElement(MenuItem, { key: 'i', value: 'intermediate' }, 'Intermediário'),
              React.createElement(MenuItem, { key: 'a', value: 'advanced' }, 'Avançado'),
            ]
          )
        )

      case 1:
        return Array.isArray(categories) && categories.length
          ? React.createElement(
              FormControl,
              { fullWidth: true },
              React.createElement(InputLabel, null, 'Categoria'),
              React.createElement(
                Select,
                {
                  value: categoryId,
                  label: 'Categoria',
                  onChange: e => {
                    setCategoryId(e.target.value)
                    setSubcategoryId('')
                    setSelectedTags([])
                    setAvailableTags([])
                  }
                },
                categories.map(cat =>
                  React.createElement(MenuItem, { key: cat._id, value: cat._id }, cat.title)
                )
              )
            )
          : React.createElement(
              Typography,
              { sx: { mt: 2 } },
              loading ? 'Carregando categorias...' : 'Nenhuma categoria disponível.'
            )

      case 2:
        return !filteredSubs.length
          ? React.createElement(Typography, { sx: { mt: 2 } }, 'Nenhuma subcategoria disponível.')
          : React.createElement(
              FormControl,
              { fullWidth: true },
              React.createElement(InputLabel, null, 'Subcategoria'),
              React.createElement(
                Select,
                {
                  value: subcategoryId,
                  label: 'Subcategoria',
                  onChange: e => {
                    setSubcategoryId(e.target.value)
                    setSelectedTags([])
                  }
                },
                filteredSubs.map(sub =>
                  React.createElement(MenuItem, { key: sub._id, value: sub._id }, sub.title)
                )
              )
            )

      // --- passo: seleção de tags ---
      case 3:
        if (loadingTags)
          return React.createElement(Typography, { sx: { mt: 2 } }, 'Carregando tags...')

        if (!availableTags.length)
          return React.createElement(Typography, { sx: { mt: 2 } }, 'Nenhuma tag disponível para esta subcategoria.')

        return React.createElement(
          Box,
          null,
          React.createElement(Typography, { variant: 'subtitle1', sx: { mb: 1 } }, 'Selecione as tags relacionadas'),
          React.createElement(
            FormGroup,
            null,
            availableTags.map(tag =>
              React.createElement(FormControlLabel, {
                key: tag._id,
                control: React.createElement(Checkbox, {
                  checked: selectedTags.includes(tag._id),
                  onChange: () => toggleTag(tag._id)
                }),
                label: tag.title
              })
            )
          )
        )

      case 4:
        return React.createElement(
          Box,
          { textAlign: 'center' },
          React.createElement(Typography, { variant: 'h6', sx: { mb: 2 } }, 'Pronto para gerar seu curso?'),
          React.createElement(
            Typography,
            { variant: 'body2', color: 'gray' },
            'O conteúdo será gerado automaticamente com base nas opções selecionadas.'
          )
        )

      default:
        return null
    }
  }

  return React.createElement(
    Box,
    { sx: { maxWidth: 600, mx: 'auto', mt: 5 } },
    React.createElement(Typography, { variant: 'h4', sx: { mb: 2 } }, 'Criar Novo Curso'),
    React.createElement(Typography, { variant: 'body1', sx: { mb: 3 } }, 'Siga o passo a passo para configurar seu curso.'),
    error && React.createElement(Alert, { severity: 'error', sx: { mb: 2 } }, error),
    React.createElement(
      Stepper,
      { activeStep, alternativeLabel: true, sx: { mb: 4 } },
      steps.map(label =>
        React.createElement(Step, { key: label }, React.createElement(StepLabel, null, label))
      )
    ),
    renderStepContent(),
    React.createElement(
      Box,
      { sx: { display: 'flex', justifyContent: 'space-between', mt: 4 } },
      React.createElement(Button, { disabled: activeStep === 0, onClick: handleBack, variant: 'outlined' }, 'Voltar'),
      React.createElement(Button, {
        variant: 'contained',
        onClick: handleNext,
        disabled:
          (activeStep === 1 && !categoryId) ||
          (activeStep === 2 && !subcategoryId)
      }, activeStep === steps.length - 1 ? 'Gerar Curso' : 'Próximo')
    )
  )
}

export default NewCourseWizard
