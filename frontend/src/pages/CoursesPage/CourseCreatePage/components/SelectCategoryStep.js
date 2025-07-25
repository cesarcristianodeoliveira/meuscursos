// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectCategoryStep.js
import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    CircularProgress,
    Alert,
} from '@mui/material';

// onCategorySelectAndAdvance é a única função de clique
// Adicionada a prop 'geminiQuotaExceeded'
function SelectCategoryStep({ categories, selectedCategory, onCategorySelectAndAdvance, loading, error, geminiQuotaExceeded }) {
    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
                Selecione a Categoria Principal do Curso
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Exibe erros de rede/servidor (se houver) */}
                    {error && (
                        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                    )}

                    {/* NOVO: Exibe o aviso de cota da Gemini API, independentemente de haver categorias ou outros erros.
                        A severidade é 'warning' pois é um aviso sobre a funcionalidade de sugestão. */}
                    {geminiQuotaExceeded && (
                        <Alert severity="warning" sx={{ m: 2 }}>
                            Cota da Gemini API excedida. As categorias sugeridas podem não estar completas.
                        </Alert>
                    )}

                    {/* Renderiza as categorias se existirem */}
                    {categories.length > 0 ? (
                        <List component="nav" aria-label="main course categories">
                            {categories.map((category) => (
                                <ListItemButton
                                    key={category._id}
                                    selected={selectedCategory && selectedCategory._id === category._id}
                                    onClick={() => onCategorySelectAndAdvance(category)} 
                                    sx={{
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
                            ))}
                        </List>
                    ) : (
                        // Exibe mensagem se não houver categorias do Sanity E não houver um erro de rede/servidor.
                        // A condição `!geminiQuotaExceeded` FOI REMOVIDA daqui, permitindo que esta mensagem
                        // apareça mesmo se a cota da Gemini estiver excedida.
                        !error && ( 
                            <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                                Nenhuma categoria disponível no Sanity.io. Por favor, crie uma.
                            </Typography>
                        )
                    )}
                </>
            )}
        </Box>
    );
}

export default SelectCategoryStep;
