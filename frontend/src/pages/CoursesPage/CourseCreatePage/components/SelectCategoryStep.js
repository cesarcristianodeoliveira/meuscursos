// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\SelectCategoryStep.js
import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';

function SelectCategoryStep({ categories, selectedCategory, setSelectedCategory, loading, error }) {
    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Selecione a Categoria Principal do Curso
            </Typography>
            <List>
                {categories.length === 0 && !loading && !error && (
                    <Typography variant="body2" color="textSecondary">
                        Nenhuma categoria disponível. Verifique o backend ou sua conexão.
                    </Typography>
                )}
                {categories.map((category) => (
                    <ListItem
                        button
                        key={category._id}
                        selected={selectedCategory && selectedCategory._id === category._id}
                        onClick={() => setSelectedCategory(category)}
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
                ))}
            </List>
        </Box>
    );
}

export default SelectCategoryStep;