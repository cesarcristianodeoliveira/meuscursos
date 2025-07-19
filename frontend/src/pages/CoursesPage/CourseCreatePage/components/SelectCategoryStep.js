// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectCategoryStep.js
import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItemButton, // Alterado de ListItem para ListItemButton
    ListItemText,
    CircularProgress,
    Alert,
} from '@mui/material';

// onCategorySelectAndAdvance é a única função de clique
function SelectCategoryStep({ categories, selectedCategory, onCategorySelectAndAdvance, loading, error }) {
    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
                Selecione a Categoria Principal do Curso
            </Typography>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
            ) : (
                <>
                    <List component="nav" aria-label="main course categories">
                        {categories.length === 0 ? (
                            <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                                Nenhuma categoria disponível. Verifique o backend ou sua conexão.
                            </Typography>
                        ) : (
                            categories.map((category) => (
                                <ListItemButton
                                    key={category._id}
                                    selected={selectedCategory && selectedCategory._id === category._id}
                                    onClick={() => onCategorySelectAndAdvance(category)} 
                                    sx={{
                                        // Estilo baseado no exemplo, mas mantendo a seleção visível
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.main', // Cor de destaque para selecionado
                                            color: 'white', // Texto branco para contraste
                                            '&:hover': {
                                                backgroundColor: 'primary.dark', // Escurece no hover
                                            },
                                        },
                                        '&:hover': {
                                            backgroundColor: 'action.hover', // Cor padrão de hover
                                        },
                                        borderRadius: '4px', // Mantém bordas arredondadas
                                        margin: '4px 8px', // Adiciona um pequeno espaçamento entre os itens
                                    }}
                                >
                                    <ListItemText primary={category.name} />
                                </ListItemButton>
                            ))
                        )}
                    </List>
                </>
            )}
        </Box>
    );
}

export default SelectCategoryStep;
