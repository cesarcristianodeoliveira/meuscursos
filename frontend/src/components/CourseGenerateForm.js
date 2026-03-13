import React from 'react';
import { Box, TextField, Button } from '@mui/material';

const CourseGenerateForm = ({ topic, setTopic, onGenerate, isGenerating }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) {
      onGenerate();
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ display: 'flex', gap: 2, mb: 3 }}
    >
      <TextField
        fullWidth
        label="O que você deseja aprender?"
        variant="outlined"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        disabled={isGenerating}
        placeholder="Ex: Marketing Digital avançado, Culinária Vegana..."
      />
      <Button 
        variant="contained" 
        type="submit" 
        size="large" 
        disabled={isGenerating || !topic.trim()} 
        sx={{ px: 2, minWidth: 100 }}
      >
        {isGenerating ? 'Gerando' : 'Gerar'}
      </Button>
    </Box>
  );
};

export default CourseGenerateForm;