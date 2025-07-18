// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectTagsStep.js
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function SelectTagsStep() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Passo 3: Selecione as Tags
            </Typography>
            <Alert severity="info">
                Funcionalidade de Tags em desenvolvimento para esta versão 0.1.
                Por favor, volte para o Passo 1 ou aguarde as próximas atualizações.
            </Alert>
        </Box>
    );
}

export default SelectTagsStep;