// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\ReviewAndCreateStep.js
import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function ReviewAndCreateStep({ /* props desativadas na v0.1 */ }) {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Passo 4: Revisar e Criar
            </Typography>
            <Alert severity="info">
                Funcionalidade de Criação de Curso em desenvolvimento para esta versão 0.1.
                Por favor, volte para o Passo 1 ou aguarde as próximas atualizações.
            </Alert>
        </Box>
    );
}

export default ReviewAndCreateStep;