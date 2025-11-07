import React, { useEffect, useState } from 'react'
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material'
import { useCourse } from '../../context/CourseContext'
import { getCategories } from '../../services/api'

const StepCategory = ({ onNext, onBack }) => {
  const { category, setCategory } = useCourse()
  const [list, setList] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const cats = await getCategories()
        if (mounted) setList(cats || [])
      } catch (err) {
        console.error('getCategories', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return React.createElement(Box, null,
    [
      React.createElement(Typography, { key: 't', sx: { mb: 2 } }, 'Selecione a Categoria'),
      React.createElement(FormControl, { key: 'f', fullWidth: true, sx: { mb: 3 } },
        [
          React.createElement(InputLabel, { key: 'l' }, 'Categoria'),
          React.createElement(Select, {
            key: 's',
            value: category?._id || '',
            label: 'Categoria',
            onChange: e => {
              const id = e.target.value
              const found = list.find(x => x._id === id) || null
              setCategory(found)
            }
          },
            list.map(c => React.createElement(MenuItem, { key: c._id, value: c._id }, c.title))
          )
        ]
      ),
      React.createElement(Box, { key: 'b', sx: { display: 'flex', justifyContent: 'space-between' } },
        [
          React.createElement(Button, { key: 'back', onClick: onBack }, 'Voltar'),
          React.createElement(Button, { key: 'next', variant: 'contained', onClick: onNext, disabled: !category }, 'Próximo')
        ]
      )
    ]
  )
}

export default StepCategory
