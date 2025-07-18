// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectSubCategoryStep.js
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function SelectSubCategoryStep() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Passo 2: Selecione a Subcategoria
            </Typography>
            <Alert severity="info">
                Funcionalidade de Subcategorias em desenvolvimento para esta versão 0.1.
                Por favor, volte para o Passo 1 ou aguarde as próximas atualizações.
            </Alert>
        </Box>
    );
}

export default SelectSubCategoryStep;