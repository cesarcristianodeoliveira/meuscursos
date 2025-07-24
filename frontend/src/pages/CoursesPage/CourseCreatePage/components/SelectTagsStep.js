// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectTagsStep.js

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'; // Importa forwardRef e useImperativeHandle
import {
    Box,
    Typography,
    Chip, 
    CircularProgress,
    Alert,
    Button,
    Stack, 
    Grid, 
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Envolve o componente com forwardRef
const SelectTagsStep = forwardRef(({ 
    selectedCategory, 
    selectedSubcategory, 
    onTagsSelectAndAdvance, 
    onGoBack, 
    isAdmin, 
    onOpenAddTagModal, 
    onShowAlert, 
    minTags, 
    maxTags,
    userToken 
}, ref) => { // Recebe 'ref' como segundo argumento
    const [availableTags, setAvailableTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const [errorTags, setErrorTags] = useState(null);
    const [selectedLocalTags, setSelectedLocalTags] = useState([]); 
    const [creatingTagOnSelect, setCreatingTagOnSelect] = useState(false); 

    // Função para buscar tags do backend
    const fetchTags = useCallback(async () => {
        if (!userToken) {
            setErrorTags("Usuário não autenticado. Não é possível buscar tags.");
            setAvailableTags([]);
            onShowAlert("Você precisa estar logado para buscar tags.", "warning");
            return;
        }
        
        setLoadingTags(true);
        setErrorTags(null);
        try {
            const params = {};
            if (selectedSubcategory && selectedSubcategory._id) {
                params.subcategoryId = selectedSubcategory._id;
                params.subcategoryName = selectedSubcategory.name;
            } else if (selectedCategory && selectedCategory._id) {
                params.categoryId = selectedCategory._id;
                params.categoryName = selectedCategory.name;
            }
            
            const response = await axios.get(`${API_BASE_URL}/api/tags`, {
                params: params,
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
            
            setAvailableTags(Array.isArray(response.data.tags) ? response.data.tags : []); 
            
            if (response.data.geminiQuotaExceeded) {
                onShowAlert('Cota da Gemini API excedida para tags. As sugestões podem não estar completas.', 'warning');
            }

        } catch (err) {
            console.error('Erro ao buscar tags:', err);
            setAvailableTags([]); 
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setErrorTags('Erro de rede: O servidor backend pode não estar rodando ou está inacessível.');
                    onShowAlert('Erro de conexão com o servidor de tags. Tente novamente.', 'error');
                } else if (err.response) {
                    setErrorTags(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Erro desconhecido.'}`);
                    onShowAlert(`Erro ao buscar tags: ${err.response.data.message || 'Algo deu errado no servidor.'}`, 'error');
                }
            } else {
                setErrorTags('Ocorreu um erro desconhecido ao carregar tags.');
                onShowAlert('Ocorreu um erro inesperado ao carregar tags.', 'error');
            }
        } finally {
            setLoadingTags(false);
        }
    }, [userToken, selectedCategory, selectedSubcategory, onShowAlert]);

    // Expõe a função fetchTags para o componente pai via ref
    useImperativeHandle(ref, () => ({
        fetchTags: fetchTags
    }));

    // Efeito para carregar as tags quando a categoria ou subcategoria selecionada muda
    useEffect(() => {
        if (userToken) { 
            fetchTags();
        } else {
            setAvailableTags([]);
            setSelectedLocalTags([]);
            setErrorTags(null);
        }
    }, [userToken, selectedCategory, selectedSubcategory, fetchTags]);

    // Handler para alternar a seleção de uma tag
    const handleTagClick = useCallback(async (tag) => {
        let finalTag = tag;

        // Se a tag selecionada é uma sugestão da Gemini (ID começa com 'gemini-')
        if (tag._id.startsWith('gemini-')) {
            setCreatingTagOnSelect(true);
            try {
                const categoryIds = [];
                const categoryNames = [];

                if (selectedSubcategory && selectedSubcategory._id && selectedSubcategory.name) {
                    categoryIds.push(selectedSubcategory._id);
                    categoryNames.push(selectedSubcategory.name);
                }
                const isParentCategoryAlreadyAdded = selectedSubcategory && selectedSubcategory.parentCategoryId === selectedCategory._id;
                if (selectedCategory && selectedCategory._id && selectedCategory.name && !isParentCategoryAlreadyAdded) {
                    categoryIds.push(selectedCategory._id);
                    categoryNames.push(selectedCategory.name);
                }

                // Passa o objeto da categoria pai real para o backend se a subcategoria for Gemini
                let parentCategoryForSubcategoryGemini = null;
                if (selectedSubcategory && selectedSubcategory._id.startsWith('gemini-') && selectedCategory) {
                    parentCategoryForSubcategoryGemini = selectedCategory;
                }

                const response = await axios.post(`${API_BASE_URL}/api/tags`, 
                    {
                        title: tag.name.trim(),
                        categoryIds: categoryIds, 
                        categoryNames: categoryNames,
                        parentCategoryForSubcategoryGemini: parentCategoryForSubcategoryGemini 
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${userToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                finalTag = response.data; 

                onShowAlert(`Tag "${finalTag.name}" criada e selecionada com sucesso!`, 'success');
                await fetchTags(); // Recarrega as tags para incluir a recém-criada do Sanity

            } catch (error) {
                console.error('Erro ao criar tag ao selecionar:', error.response?.data || error.message);
                const errorMessage = error.response?.data?.message || 'Erro ao criar tag. Tente novamente.';
                onShowAlert(errorMessage, 'error');
                setCreatingTagOnSelect(false);
                return; 
            } finally {
                setCreatingTagOnSelect(false);
            }
        }

        setSelectedLocalTags((prevSelectedTags) => {
            const isSelected = prevSelectedTags.some((t) => t._id === finalTag._id);
            if (isSelected) {
                return prevSelectedTags.filter((t) => t._id !== finalTag._id);
            } else {
                if (prevSelectedTags.length < maxTags) {
                    return [...prevSelectedTags, finalTag];
                } else {
                    onShowAlert(`Você pode selecionar no máximo ${maxTags} tags.`, 'info');
                    return prevSelectedTags;
                }
            }
        });
    }, [selectedCategory, selectedSubcategory, onShowAlert, fetchTags, maxTags, userToken]); 

    // Handler para remover uma tag usando o 'onDelete' do Chip
    const handleDeleteTag = useCallback((tagToDelete) => {
        setSelectedLocalTags((prevSelectedTags) => 
            prevSelectedTags.filter(tag => tag._id !== tagToDelete._id)
        );
    }, []);

    // Handler para o botão "Voltar"
    const handleGoBackClick = () => {
        onGoBack(); 
    };

    // Handler para o botão "Adicionar Nova Tag (Admin)"
    const handleOpenAddTagModalClick = useCallback(() => {
        onOpenAddTagModal(); 
    }, [onOpenAddTagModal]);

    // Handler para o botão "Próximo"
    const handleNextClick = () => {
        if (selectedLocalTags.length < minTags) { 
            onShowAlert(`Por favor, selecione no mínimo ${minTags} tag(s).`, 'warning'); 
            return;
        }
        onTagsSelectAndAdvance(selectedLocalTags); 
    };

    const isNextButtonDisabled = selectedLocalTags.length < minTags || selectedLocalTags.length > maxTags || creatingTagOnSelect;

    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
                Passo 3: Selecione as Tags do Curso
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ px: 2, pb: 2 }}>
                Selecione de {minTags} a {maxTags} tags relevantes para o seu curso.
                {selectedCategory && (
                    <Box component="span" sx={{ display: 'block', mt: 1 }}>
                        Sugestões baseadas em: <strong>{selectedSubcategory?.name || selectedCategory.name}</strong>
                    </Box>
                )}
            </Typography>

            {/* Tags Selecionadas */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" gutterBottom>
                    Tags Selecionadas ({selectedLocalTags.length}/{maxTags}):
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {selectedLocalTags.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">
                            Nenhuma tag selecionada.
                        </Typography>
                    ) : (
                        selectedLocalTags.map((tag) => (
                            <Chip
                                key={tag._id}
                                label={tag.name}
                                variant="filled"
                                color="primary"
                                onDelete={() => handleDeleteTag(tag)}
                                sx={{ m: 0.5 }}
                            />
                        ))
                    )}
                </Stack>
            </Box>

            {/* Tags Disponíveis */}
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Tags Disponíveis:
                </Typography>
                {(loadingTags || creatingTagOnSelect) ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : errorTags ? (
                    <Alert severity="error">{errorTags}</Alert>
                ) : (
                    <Grid container spacing={1}> 
                        {availableTags.length === 0 ? (
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', my: 4 }}>
                                    Nenhuma tag disponível para sugestão.
                                    {!selectedCategory && !selectedSubcategory && (
                                        <Box component="span" sx={{ display: 'block', mt: 1 }}>
                                            Selecione uma categoria ou subcategoria para ver as tags sugeridas.
                                        </Box>
                                    )}
                                </Typography>
                            </Grid>
                        ) : (
                            availableTags.map((tag) => {
                                const isSelected = selectedLocalTags.some(t => t._id === tag._id);
                                return (
                                    <Grid item key={tag._id}>
                                        <Chip
                                            label={tag.name}
                                            variant={isSelected ? "filled" : "outlined"}
                                            color={isSelected ? "primary" : "default"}
                                            onClick={() => handleTagClick(tag)}
                                            sx={{ m: 0.5, cursor: 'pointer' }}
                                        />
                                    </Grid>
                                );
                            })
                        )}
                    </Grid>
                )}
            </Box>

            {isAdmin && (
                <Box sx={{ mt: 2, textAlign: 'center', p: 2 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleOpenAddTagModalClick}
                        disabled={creatingTagOnSelect}
                    >
                        Criar Nova Tag (Admin)
                    </Button>
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, p: 2 }}>
                <Button variant="outlined" onClick={handleGoBackClick}>
                    Voltar para Subcategorias
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleNextClick}
                    disabled={isNextButtonDisabled}
                >
                    Próximo
                </Button>
            </Box>
        </Box>
    );
}); // Fecha o forwardRef

export default SelectTagsStep;
