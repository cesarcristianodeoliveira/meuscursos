// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectCategoryStep.js
import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    // Button REMOVIDO
} from '@mui/material';

// onCategorySelectAndAdvance é a única função de clique
// isAdmin e onAddCategoryClick REMOVIDOS
function SelectCategoryStep({ categories, selectedCategory, onCategorySelectAndAdvance, loading, error }) {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Selecione a Categoria Principal do Curso
            </Typography>
            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <>
                    <List>
                        {categories.length === 0 ? (
                            <Typography variant="body2" color="textSecondary">
                                Nenhuma categoria disponível. Verifique o backend ou sua conexão.
                            </Typography>
                        ) : (
                            categories.map((category) => (
                                <ListItem
                                    button
                                    key={category._id}
                                    selected={selectedCategory && selectedCategory._id === category._id}
                                    onClick={() => onCategorySelectAndAdvance(category)} 
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '4px',
                                        marginBottom: '8px',
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.light',
                                            '&:hover': {
                                                backgroundColor: 'primary.light',
                                            },
                                        },
                                    }}
                                >
                                    <ListItemText primary={category.name} />
                                </ListItem>
                            ))
                        )}
                    </List>
                    {/* O botão "Criar Nova Categoria (Admin)" foi movido para o index.js */}
                </>
            )}
        </Box>
    );
}

export default SelectCategoryStep;
