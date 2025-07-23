// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectSubCategoryStep.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
    Grid, // Adicionado para layout de grid
    Card, // Adicionado para cards de seleção
    CardContent,
    Button,
    Chip // Adicionado para exibir a categoria principal de forma visual
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function SelectSubCategoryStep({ selectedCategory, selectedSubcategory, onSubcategorySelectAndAdvance, onGoBack, isAdmin, onOpenAddSubCategoryModal, onShowAlert }) {
    const [subcategories, setSubcategories] = useState([]);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [errorSubcategories, setErrorSubcategories] = useState(null);
    const [creatingSubcategoryOnSelect, setCreatingSubcategoryOnSelect] = useState(false); // NOVO: Estado para carregamento ao criar subcategoria ao selecionar

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
                    categoryName: selectedCategory.name 
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('userToken')}` 
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
    }, [selectedCategory, onShowAlert]); 

    // Efeito para carregar subcategorias quando a categoria selecionada muda
    useEffect(() => {
        fetchSubcategories();
    }, [fetchSubcategories]);

    // NOVO: Função para lidar com a seleção de subcategoria (com criação automática)
    const handleSubcategoryClick = useCallback(async (subCat) => {
        // Se a subcategoria selecionada é uma sugestão da Gemini (ID começa com 'gemini-')
        if (subCat._id.startsWith('gemini-')) {
            setCreatingSubcategoryOnSelect(true);
            try {
                const response = await axios.post(`${API_BASE_URL}/api/subcategories`, 
                    { 
                        title: subCat.name.trim(),
                        parentCategoryId: selectedCategory._id,
                        parentCategoryName: selectedCategory.name
                    },
                    { 
                        headers: { 
                            Authorization: `Bearer ${localStorage.getItem('userToken')}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );
                const createdSubcategory = response.data; // Backend retorna o _id real do Sanity
                
                onShowAlert(`Subcategoria "${createdSubcategory.name}" criada e selecionada com sucesso!`, 'success');
                await fetchSubcategories(); // Recarrega as subcategorias para incluir a recém-criada do Sanity
                onSubcategorySelectAndAdvance(createdSubcategory); // Avança com a subcategoria real do Sanity

            } catch (error) {
                console.error('Erro ao criar subcategoria ao selecionar:', error.response?.data || error.message);
                const errorMessage = error.response?.data?.message || 'Erro ao criar subcategoria. Tente novamente.';
                onShowAlert(errorMessage, 'error');
                setCreatingSubcategoryOnSelect(false); 
                return; // Não avança se a criação falhar
            } finally {
                setCreatingSubcategoryOnSelect(false);
            }
        } else {
            // Se não for uma subcategoria Gemini, apenas seleciona e avança
            onSubcategorySelectAndAdvance(subCat);
        }
    }, [selectedCategory, onShowAlert, onSubcategorySelectAndAdvance, fetchSubcategories]);


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Selecione a Subcategoria do Curso
            </Typography>
            {selectedCategory ? (
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                        Categoria principal:
                    </Typography>
                    <Chip label={selectedCategory.name} color="primary" variant="outlined" />
                </Box>
            ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Nenhuma categoria principal selecionada. Por favor, volte ao passo anterior.
                </Alert>
            )}

            {(loadingSubcategories || creatingSubcategoryOnSelect) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : errorSubcategories ? (
                <Alert severity="error">{errorSubcategories}</Alert>
            ) : (
                <>
                    <Grid container spacing={2}>
                        {subcategories.length === 0 ? (
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', my: 4 }}>
                                    Nenhuma subcategoria disponível para esta categoria.
                                </Typography>
                            </Grid>
                        ) : (
                            subcategories.map((subCat) => (
                                <Grid item xs={12} sm={6} md={4} key={subCat._id}>
                                    <Card
                                        variant="outlined"
                                        onClick={() => handleSubcategoryClick(subCat)} // Usa a nova função de clique
                                        sx={{
                                            cursor: 'pointer',
                                            borderColor: selectedSubcategory && selectedSubcategory._id === subCat._id ? 'primary.main' : 'grey.300',
                                            borderWidth: selectedSubcategory && selectedSubcategory._id === subCat._id ? '2px' : '1px',
                                            '&:hover': {
                                                boxShadow: 3,
                                                borderColor: 'primary.light',
                                            },
                                        }}
                                    >
                                        <CardContent>
                                            <Typography variant="subtitle1" component="div">
                                                {subCat.name}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))
                        )}
                    </Grid>
                    {isAdmin && (
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => onOpenAddSubCategoryModal(selectedCategory)} 
                                disabled={!selectedCategory || creatingSubcategoryOnSelect} // Desabilita enquanto cria ao selecionar
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
                    onClick={() => onSubcategorySelectAndAdvance(selectedSubcategory)} 
                    disabled={!selectedSubcategory || creatingSubcategoryOnSelect} // Desabilita enquanto cria ao selecionar
                >
                    Próximo
                </Button>
            </Box>
        </Box>
    );
}

export default SelectSubCategoryStep;
