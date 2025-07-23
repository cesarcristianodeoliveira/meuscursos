// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectSubCategoryStep.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Button // Adicionado para o botão de admin
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function SelectSubCategoryStep({ selectedCategory, selectedSubcategory, onSubcategorySelectAndAdvance, onGoBack, isAdmin, onOpenAddSubCategoryModal, onShowAlert }) {
    const [subcategories, setSubcategories] = useState([]);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [errorSubcategories, setErrorSubcategories] = useState(null);

    // Função para buscar subcategorias do backend
    const fetchSubcategories = useCallback(async () => {
        if (!selectedCategory || !selectedCategory._id) {
            setSubcategories([]);
            setErrorSubcategories('Nenhuma categoria principal selecionada para buscar subcategorias.');
            return;
        }

        setLoadingSubcategories(true);
        setErrorSubcategories(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/subcategories`, {
                params: { 
                    categoryId: selectedCategory._id,
                    categoryName: selectedCategory.name // Passa o nome para o backend
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('userToken')}` // Ajuste conforme seu AuthContext
                }
            });
            
            setSubcategories(Array.isArray(response.data.subcategories) ? response.data.subcategories : []); 
            
            if (response.data.geminiQuotaExceeded) {
                onShowAlert('Cota da Gemini API excedida para subcategorias. As sugestões podem não estar completas.', 'warning');
            }

        } catch (err) {
            console.error('Erro ao buscar subcategorias:', err);
            setSubcategories([]); 
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setErrorSubcategories('Erro de rede: O servidor backend pode não estar rodando ou está inacessível.');
                    onShowAlert('Erro de conexão com o servidor. Tente novamente.', 'error');
                } else if (err.response) {
                    setErrorSubcategories(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Erro desconhecido.'}`);
                    onShowAlert(`Erro: ${err.response.data.message || 'Algo deu errado no servidor.'}`, 'error');
                }
            } else {
                setErrorSubcategories('Ocorreu um erro desconhecido ao carregar subcategorias.');
                onShowAlert('Ocorreu um erro inesperado.', 'error');
            }
        } finally {
            setLoadingSubcategories(false);
        }
    }, [selectedCategory, onShowAlert]); // Adicionado onShowAlert como dependência

    // Efeito para carregar subcategorias quando a categoria selecionada muda
    useEffect(() => {
        fetchSubcategories();
    }, [fetchSubcategories]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Selecione a Subcategoria do Curso
            </Typography>
            {selectedCategory ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Categoria principal: <strong>{selectedCategory.name}</strong>
                </Alert>
            ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Nenhuma categoria principal selecionada. Por favor, volte ao passo anterior.
                </Alert>
            )}

            {loadingSubcategories ? (
                <CircularProgress />
            ) : errorSubcategories ? (
                <Alert severity="error">{errorSubcategories}</Alert>
            ) : (
                <>
                    <List>
                        {subcategories.length === 0 ? (
                            <Typography variant="body2" color="textSecondary">
                                Nenhuma subcategoria disponível para esta categoria.
                            </Typography>
                        ) : (
                            subcategories.map((subCat) => (
                                <ListItem
                                    button
                                    key={subCat._id}
                                    selected={selectedSubcategory && selectedSubcategory._id === subCat._id}
                                    onClick={() => onSubcategorySelectAndAdvance(subCat)}
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
                                    <ListItemText primary={subCat.name} />
                                </ListItem>
                            ))
                        )}
                    </List>
                    {isAdmin && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => onOpenAddSubCategoryModal(selectedCategory)} // Passa a categoria selecionada
                                disabled={!selectedCategory} // Desabilita se não houver categoria selecionada
                            >
                                Criar Nova Subcategoria (Admin)
                            </Button>
                        </Box>
                    )}
                </>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={onGoBack} variant="outlined">
                    Voltar
                </Button>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => onSubcategorySelectAndAdvance(selectedSubcategory)} // Avança com a subcategoria selecionada
                    disabled={!selectedSubcategory} // Desabilita se nenhuma subcategoria estiver selecionada
                >
                    Próximo
                </Button>
            </Box>
        </Box>
    );
}

export default SelectSubCategoryStep;
