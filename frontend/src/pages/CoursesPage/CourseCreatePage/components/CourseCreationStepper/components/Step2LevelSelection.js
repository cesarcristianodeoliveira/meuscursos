// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\CourseCreationStepper\components\Step2LevelSelection.js

import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const Step2LevelSelection = ({ formData, updateFormData }) => {
  const handleChange = (e) => {
    updateFormData({ level: e.target.value });
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2, 
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      <FormControl fullWidth required sx={{ maxWidth: 400 }}>
        <InputLabel id="level-label">Nível de Dificuldade</InputLabel>
        <Select
          labelId="level-label"
          id="level-select"
          name="level"
          value={formData.level || ''}
          label="Nível de Dificuldade"
          onChange={handleChange}
          sx={{ '& .MuiSelect-select': { py: 1.5, fontSize: '1.1rem' } }}
        >
          <MenuItem value="beginner">Iniciante</MenuItem>
          <MenuItem value="intermediate">Intermediário</MenuItem>
          <MenuItem value="advanced">Avançado</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default Step2LevelSelection;
