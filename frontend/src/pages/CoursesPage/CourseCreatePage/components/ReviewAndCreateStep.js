// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\ReviewAndCreateStep.js

import React from 'react';
import {
    Box,
    Typography,
    Paper, // Para agrupar a revisão
    Chip, // Para exibir as tags
    Stack, // Para organizar os chips
    Button,
    Alert
} from '@mui/material';

function ReviewAndCreateStep({ 
    selectedCategory, 
    selectedSubcategory, 
    selectedTags, 
    onGoBack, // Callback para voltar ao passo anterior
    onCreateCourse // Callback futuro para criar o curso
}) {
    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
                Passo 4: Revisar e Criar Curso
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ px: 2, pb: 2 }}>
                Revise as informações selecionadas antes de criar o curso.
            </Typography>

            <Paper elevation={1} sx={{ p: 3, m: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <Typography variant="subtitle1" gutterBottom>
                    Resumo do Curso:
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                        <strong>Categoria Principal:</strong>{' '}
                        {selectedCategory ? selectedCategory.name : <span style={{ color: 'red' }}>Nenhuma selecionada</span>}
                    </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                        <strong>Subcategoria:</strong>{' '}
                        {selectedSubcategory ? selectedSubcategory.name : <span style={{ color: 'red' }}>Nenhuma selecionada</span>}
                    </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                        <strong>Tags Selecionadas:</strong>
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {selectedTags && selectedTags.length > 0 ? (
                            selectedTags.map((tag) => (
                                <Chip
                                    key={tag._id}
                                    label={tag.name}
                                    variant="outlined"
                                    color="info"
                                    sx={{ m: 0.5 }}
                                />
                            ))
                        ) : (
                            <Typography variant="body2" color="textSecondary">
                                Nenhuma tag selecionada.
                            </Typography>
                        )}
                    </Stack>
                </Box>

                {/* Adicione mais campos de revisão aqui conforme o curso for evoluindo */}
                <Alert severity="info" sx={{ mt: 3 }}>
                    Esta é uma versão inicial. Mais detalhes do curso (título, descrição, instrutor, etc.) serão adicionados em futuras atualizações.
                </Alert>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, p: 2 }}>
                <Button variant="outlined" onClick={onGoBack}>
                    Voltar para Tags
                </Button>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={onCreateCourse} // Chama a função de criação (futura)
                    disabled // Desabilitado por enquanto, pois a lógica de criação ainda não está implementada
                >
                    Criar Curso (Em Breve)
                </Button>
            </Box>
        </Box>
    );
}

export default ReviewAndCreateStep;
