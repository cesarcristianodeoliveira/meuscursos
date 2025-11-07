import React, { useEffect, useState } from 'react'
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material'
import { useCourse } from '../../context/CourseContext'
import { getSubcategories } from '../../services/api'

const StepSubcategory = ({ onNext, onBack }) => {
  const { subcategory, setSubcategory, category } = useCourse()
  const [list, setList] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const subs = await getSubcategories(category?._id)
        if (mounted) setList(subs || [])
      } catch (err) {
        console.error('getSubcategories', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [category])

  return React.createElement(Box, null,
    [
      React.createElement(Typography, { key: 't', sx: { mb: 2 } }, 'Selecione a Subcategoria'),
      React.createElement(FormControl, { key: 'f', fullWidth: true, sx: { mb: 3 } },
        [
          React.createElement(InputLabel, { key: 'l' }, 'Subcategoria'),
          React.createElement(Select, {
            key: 's',
            value: subcategory?._id || '',
            label: 'Subcategoria',
            onChange: e => {
              const id = e.target.value
              const found = list.find(x => x._id === id) || null
              setSubcategory(found)
            }
          },
            list.map(s => React.createElement(MenuItem, { key: s._id, value: s._id }, s.title))
          )
        ]
      ),
      React.createElement(Box, { key: 'b', sx: { display: 'flex', justifyContent: 'space-between' } },
        [
          React.createElement(Button, { key: 'back', onClick: onBack }, 'Voltar'),
          React.createElement(Button, { key: 'next', variant: 'contained', onClick: onNext, disabled: !subcategory }, 'Próximo')
        ]
      )
    ]
  )
}

export default StepSubcategory
