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

            {/* Condição para exibir o indicador de carregamento */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Exibe erros de rede/servidor ou outros erros críticos (se houver) */}
                    {/* A severidade é 'error' para indicar um problema que impede o funcionamento normal. */}
                    {error && (
                        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                    )}

                    {/* Exibe o aviso de cota da Gemini API.
                        Este aviso é independente da existência de categorias ou de outros erros,
                        pois informa sobre a funcionalidade de sugestão. */}
                    {geminiQuotaExceeded && (
                        <Alert severity="warning" sx={{ m: 2 }}>
                            Cota da Gemini API excedida. As categorias sugeridas podem não estar completas.
                        </Alert>
                    )}

                    {/* Renderiza as categorias se a lista não estiver vazia */}
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
                        /* Exibe esta mensagem APENAS se não houver categorias no Sanity.io
                           E não houver um erro crítico (como erro de rede/servidor)
                           E a cota da Gemini API NÃO estiver excedida (pois se estiver, o aviso da Gemini já cobre a falta de sugestões).
                           Isso significa que o Sanity.io está realmente vazio de categorias. */
                        !error && !geminiQuotaExceeded && ( 
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
