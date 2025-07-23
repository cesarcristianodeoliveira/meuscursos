// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectTagsStep.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Chip, 
    CircularProgress,
    Alert,
    Button,
    Stack, // Para organizar os chips
    Grid, // Para organizar os chips em um grid
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function SelectTagsStep({ 
    selectedCategory, 
    selectedSubcategory, 
    onTagsSelectAndAdvance, 
    onGoBack, 
    isAdmin, 
    onOpenAddTagModal, 
    onShowAlert, 
    minTags, 
    maxTags,
    userToken // Recebe o token do pai
}) {
    const [availableTags, setAvailableTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const [errorTags, setErrorTags] = useState(null);
    const [selectedLocalTags, setSelectedLocalTags] = useState([]); // Array de tags selecionadas
    const [creatingTagOnSelect, setCreatingTagOnSelect] = useState(false); // Estado para carregamento ao criar tag ao selecionar

    // Função para buscar tags do backend
    const fetchTags = useCallback(async () => {
        if (!userToken) {
            setErrorTags("Usuário não autenticado. Não é possível buscar tags.");
            setAvailableTags([]);
            onShowAlert("Você precisa estar logado para buscar tags.", "warning");
            return;
        }
        // Se não houver categoria nem subcategoria selecionada, ainda tenta buscar tags gerais
        // mas pode exibir uma mensagem mais específica no UI.
        if (!selectedCategory && !selectedSubcategory) {
             // Não retornamos aqui para permitir a busca de tags gerais, se o backend suportar.
             // Apenas logamos um aviso ou definimos um erro se a lógica do backend exigir contexto.
             console.warn("[Frontend] Nenhuma categoria ou subcategoria selecionada para tags. Buscando tags gerais.");
        }

        setLoadingTags(true);
        setErrorTags(null);
        try {
            const params = {};
            // Prioriza a subcategoria para sugestões de tags
            if (selectedSubcategory && selectedSubcategory._id) {
                params.subcategoryId = selectedSubcategory._id;
                params.subcategoryName = selectedSubcategory.name;
            } else if (selectedCategory && selectedCategory._id) {
                // Se não houver subcategoria, usa a categoria principal
                params.categoryId = selectedCategory._id;
                params.categoryName = selectedCategory.name;
            }
            
            // CORREÇÃO AQUI: A rota agora é /api/tags, não /api/courses/create/tags
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

    // Efeito para carregar as tags quando a categoria ou subcategoria selecionada muda
    useEffect(() => {
        if (userToken) { // Só busca se houver token
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
                // Prepara os IDs e nomes das categorias/subcategorias para associação
                const categoryIds = [];
                const categoryNames = [];

                // Adiciona a subcategoria se existir e for válida
                if (selectedSubcategory && selectedSubcategory._id && selectedSubcategory.name) {
                    categoryIds.push(selectedSubcategory._id);
                    categoryNames.push(selectedSubcategory.name);
                }
                // Adiciona a categoria principal se existir, for válida E não for a mesma da subcategoria
                // Isso evita adicionar a categoria pai duas vezes se a subcategoria já a referencia
                const isParentCategoryAlreadyAdded = selectedSubcategory && selectedSubcategory.parentCategoryId === selectedCategory._id;
                if (selectedCategory && selectedCategory._id && selectedCategory.name && !isParentCategoryAlreadyAdded) {
                    categoryIds.push(selectedCategory._id);
                    categoryNames.push(selectedCategory.name);
                }

                const response = await axios.post(`${API_BASE_URL}/api/tags`, // Rota correta para criar tags
                    {
                        title: tag.name.trim(),
                        categoryIds: categoryIds, // Envia os IDs das categorias/subcategorias associadas
                        categoryNames: categoryNames // Envia os nomes para ajudar na lógica do backend
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${userToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                finalTag = response.data; // Backend retorna o _id real do Sanity

                onShowAlert(`Tag "${finalTag.name}" criada e selecionada com sucesso!`, 'success');
                await fetchTags(); // Recarrega as tags para incluir a recém-criada do Sanity

            } catch (error) {
                console.error('Erro ao criar tag ao selecionar:', error.response?.data || error.message);
                const errorMessage = error.response?.data?.message || 'Erro ao criar tag. Tente novamente.';
                onShowAlert(errorMessage, 'error');
                setCreatingTagOnSelect(false);
                return; // Não prossegue se a criação falhar
            } finally {
                setCreatingTagOnSelect(false);
            }
        }

        // Lógica de seleção/desseleção local
        setSelectedLocalTags((prevSelectedTags) => {
            const isSelected = prevSelectedTags.some((t) => t._id === finalTag._id);
            if (isSelected) {
                // Desseleciona se já estiver selecionada
                return prevSelectedTags.filter((t) => t._id !== finalTag._id);
            } else {
                // Seleciona se não estiver selecionada e o limite não foi atingido
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
        onGoBack(); // Chama o callback para voltar ao passo anterior
    };

    // Handler para o botão "Adicionar Nova Tag (Admin)"
    const handleOpenAddTagModalClick = useCallback(() => {
        onOpenAddTagModal(); // Abre o modal
    }, [onOpenAddTagModal]);

    // Handler para o botão "Próximo"
    const handleNextClick = () => {
        if (selectedLocalTags.length < minTags) { // Usa minTags da prop
            onShowAlert(`Por favor, selecione no mínimo ${minTags} tag(s).`, 'warning'); // Usa minTags da prop
            return;
        }
        onTagsSelectAndAdvance(selectedLocalTags); // Chama o callback para avançar no Stepper
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

            {/* Exibe chips das tags selecionadas */}
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

            {/* Exibe tags disponíveis para seleção */}
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
                    <Grid container spacing={1}> {/* Usando Grid para melhor layout */}
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
}

export default SelectTagsStep;
