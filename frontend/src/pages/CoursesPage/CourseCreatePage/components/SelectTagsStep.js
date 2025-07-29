// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectTagsStep.js

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
    Box,
    Typography,
    Chip, 
    CircularProgress,
    Alert,
    Button,
    Stack, 
    Grid, 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const SelectTagsStep = forwardRef(({ 
    selectedCategory, 
    selectedSubcategory, 
    onTagsSelectAndAdvance, 
    onGoBack, 
    isAdmin, 
    onShowAlert, 
    minTags, 
    maxTags,
    userToken,
    selectedTags: initialSelectedTags, // Tags vindas do componente pai
    onTagsChange // Handler para atualizar o estado de tags no componente pai
}, ref) => {
    // availableTags conterá tags do Sanity + sugestões Gemini (já deduplicadas)
    const [availableTags, setAvailableTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const [errorTags, setErrorTags] = useState(null);
    const [geminiQuotaExceededTags, setGeminiQuotaExceededTags] = useState(false);
    // selectedLocalTags é o estado interno das tags que o usuário selecionou
    const [selectedLocalTags, setSelectedLocalTags] = useState(initialSelectedTags || []); 
    const [creatingTagOnSelect, setCreatingTagOnSelect] = useState(false); // Indica que uma tag Gemini está sendo criada

    const [openAdminTagModal, setOpenAdminTagModal] = useState(false);
    const [newAdminTagName, setNewAdminTagName] = useState('');
    const [adminTagCreationLoading, setAdminTagCreationLoading] = useState(false);
    const [adminTagCreationError, setAdminTagCreationError] = useState(null);

    // Efeito para sincronizar selectedLocalTags com initialSelectedTags (prop do pai).
    // Isso garante que, ao navegar para trás e depois para frente, as tags selecionadas persistam.
    // Usamos JSON.stringify para comparar o conteúdo dos arrays e evitar loops desnecessários.
    useEffect(() => {
        if (initialSelectedTags && JSON.stringify(initialSelectedTags) !== JSON.stringify(selectedLocalTags)) {
            setSelectedLocalTags(initialSelectedTags);
        }
    }, [initialSelectedTags, selectedLocalTags]);

    // Função para buscar tags do backend.
    // O backend será responsável por combinar tags do Sanity e sugestões da Gemini,
    // e também por deduplicar as sugestões.
    const fetchTags = useCallback(async () => {
        if (!userToken) {
            setErrorTags("Usuário não autenticado. Não é possível buscar tags.");
            setAvailableTags([]);
            onShowAlert("Você precisa estar logado para buscar tags.", "warning");
            return;
        }
        
        setLoadingTags(true);
        setErrorTags(null);
        setGeminiQuotaExceededTags(false);
        try {
            const params = {};
            // Passa a categoria e/ou subcategoria para o backend para que a Gemini possa sugerir tags relevantes
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
            
            // O backend deve retornar uma lista já combinada e ordenada de tags
            const fetchedTags = Array.isArray(response.data.tags) ? response.data.tags : [];
            setAvailableTags(fetchedTags); 
            
            // Verifica se a cota da Gemini foi excedida, informando ao usuário
            if (response.data.geminiQuotaExceeded) {
                setGeminiQuotaExceededTags(true);
                onShowAlert('Cota da Gemini API excedida para tags. As sugestões podem não estar completas.', 'warning');
            } else if (fetchedTags.length === 0 && !response.data.geminiQuotaExceeded) {
                // Se não há tags e a Gemini não está excedida, significa que não há tags no Sanity
                setErrorTags('Nenhuma tag encontrada no Sanity.io. Por favor, crie uma ou selecione uma categoria/subcategoria.');
                onShowAlert('Nenhuma tag encontrada no Sanity.io. Por favor, crie uma.', 'info');
            }

        } catch (err) {
            console.error('Erro ao buscar tags:', err);
            setAvailableTags([]); 
            setGeminiQuotaExceededTags(false);
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

    // Permite que o componente pai chame fetchTags via ref
    useImperativeHandle(ref, () => ({
        fetchTags: fetchTags
    }));

    // Efeito para carregar tags quando o token do usuário ou categoria/subcategoria mudam
    useEffect(() => {
        if (userToken) { 
            fetchTags();
        } else {
            setAvailableTags([]);
            setSelectedLocalTags([]); // Limpa as tags selecionadas se o usuário não estiver logado
            setErrorTags(null);
            setGeminiQuotaExceededTags(false);
        }
    }, [userToken, selectedCategory, selectedSubcategory, fetchTags]);

    // Lógica principal para selecionar/desselecionar tags
    const handleTagClick = useCallback(async (tag) => {
        // Verifica se a tag já está na lista de selecionadas
        const isCurrentlySelected = selectedLocalTags.some((t) => t._id === tag._id);

        if (isCurrentlySelected) {
            // Se a tag já está selecionada, remove-a (desseleciona)
            const newSelectedTags = selectedLocalTags.filter((t) => t._id !== tag._id);
            setSelectedLocalTags(newSelectedTags);
            onTagsChange(newSelectedTags); // Notifica o componente pai
        } else {
            // Se a tag não está selecionada, tenta adicioná-la
            if (selectedLocalTags.length < maxTags) {
                let finalTag = tag; // A tag que será adicionada (pode ser a original ou a recém-criada)

                // Se a tag é uma sugestão da Gemini (ID começa com 'gemini-'), tenta criá-la no Sanity
                if (tag._id && tag._id.startsWith('gemini-')) {
                    setCreatingTagOnSelect(true); // Ativa o estado de carregamento
                    try {
                        const categoryIds = [];
                        const categoryNames = [];

                        if (selectedSubcategory && selectedSubcategory._id) {
                            categoryIds.push(selectedSubcategory._id);
                            categoryNames.push(selectedSubcategory.name);
                        }
                        // Verifica se a categoria pai da subcategoria já foi adicionada para evitar duplicidade
                        const isParentCategoryAlreadyAdded = selectedSubcategory && selectedSubcategory.parentCategoryId === selectedCategory._id;
                        if (selectedCategory && selectedCategory._id && selectedCategory.name && !isParentCategoryAlreadyAdded) {
                            categoryIds.push(selectedCategory._id);
                            categoryNames.push(selectedCategory.name);
                        }

                        let parentCategoryForSubcategoryGemini = null;
                        // Se a subcategoria selecionada for uma sugestão Gemini, precisamos passar a categoria pai real
                        if (selectedSubcategory && selectedSubcategory._id && selectedSubcategory._id.startsWith('gemini-') && selectedCategory) {
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
                        finalTag = response.data; // Atualiza para a tag real do Sanity (pode ser a existente ou a recém-criada)
                        onShowAlert(`Tag "${finalTag.name}" criada/selecionada com sucesso!`, 'success');
                        
                        // CRUCIAL: Recarrega as tags DISPONÍVEIS do backend.
                        // Isso garante que a tag recém-criada (agora com um ID real do Sanity)
                        // seja removida da lista de "Tags Disponíveis" corretamente na próxima renderização.
                        await fetchTags(); 

                    } catch (error) {
                        console.error('Erro ao criar tag ao selecionar:', error.response?.data || error.message);
                        const errorMessage = error.response?.data?.message || 'Erro ao criar tag. Tente novamente.';
                        onShowAlert(errorMessage, 'error');
                        setCreatingTagOnSelect(false);
                        return; // Impede a seleção se a criação falhar
                    } finally {
                        setCreatingTagOnSelect(false); // Desativa o carregamento
                    }
                }

                // Adiciona a tag (original ou recém-criada) à lista de selecionadas
                const newSelectedTags = [...selectedLocalTags, finalTag];
                setSelectedLocalTags(newSelectedTags);
                onTagsChange(newSelectedTags); // Notifica o componente pai

            } else {
                onShowAlert(`Você pode selecionar no máximo ${maxTags} tags.`, 'info');
            }
        }
    }, [selectedLocalTags, maxTags, onShowAlert, selectedCategory, selectedSubcategory, fetchTags, userToken, onTagsChange]); 

    // Efeito para avançar automaticamente se o número máximo de tags for atingido
    useEffect(() => {
        if (selectedLocalTags.length === maxTags && !creatingTagOnSelect) {
            onTagsSelectAndAdvance(selectedLocalTags);
        }
    }, [selectedLocalTags, maxTags, onTagsSelectAndAdvance, creatingTagOnSelect]);

    // Lógica para remover uma tag da lista de selecionadas
    const handleDeleteTag = useCallback((tagToDelete) => {
        setSelectedLocalTags((prevSelectedTags) => {
            const newSelectedTags = prevSelectedTags.filter(tag => tag._id !== tagToDelete._id);
            onTagsChange(newSelectedTags); // Notifica o componente pai
            return newSelectedTags;
        });
    }, [onTagsChange]); 

    const handleGoBackClick = () => {
        onGoBack(); 
    };

    // Abre o modal de criação de tag para admins
    const handleOpenAddTagModalClick = useCallback(() => {
        setOpenAdminTagModal(true); 
    }, []);

    const handleCloseAdminTagModal = () => {
        setOpenAdminTagModal(false);
        setNewAdminTagName('');
        setAdminTagCreationError(null);
    };

    // Lógica para criar uma tag via modal admin
    const handleCreateAdminTag = async () => {
        if (!newAdminTagName.trim()) {
            setAdminTagCreationError('O nome da tag não pode ser vazio.');
            return;
        }
        setAdminTagCreationLoading(true);
        setAdminTagCreationError(null);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/tags`, 
                { title: newAdminTagName.trim() },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            onShowAlert(`Tag "${response.data.name}" criada com sucesso!`, 'success');
            await fetchTags(); // Recarrega as tags para incluir a nova tag criada pelo admin
            handleCloseAdminTagModal();
        } catch (error) {
            console.error('Erro ao criar tag via modal admin:', error.response?.data || error.message);
            setAdminTagCreationError(error.response?.data?.message || 'Erro ao criar tag. Tente novamente.');
        } finally {
            setAdminTagCreationLoading(false);
        }
    };

    // Lógica para o botão "Próximo"
    const handleNextClick = () => {
        if (selectedLocalTags.length < minTags) { 
            onShowAlert(`Por favor, selecione no mínimo ${minTags} tag(s).`, 'warning'); 
            return;
        }
        onTagsSelectAndAdvance(selectedLocalTags); 
    };

    // Condição para desabilitar o botão "Próximo"
    const isNextButtonDisabled = selectedLocalTags.length < minTags || selectedLocalTags.length > maxTags || creatingTagOnSelect;

    // Filtra as tags disponíveis para NÃO INCLUIR as já selecionadas.
    // Isso garante que uma tag selecionada não apareça na lista de disponíveis.
    const filteredAvailableTags = availableTags.filter(
        (availableTag) => !selectedLocalTags.some((selectedTag) => selectedTag._id === availableTag._id)
    );

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
                                key={tag._id} // Usa _id como key para estabilidade
                                label={tag.name}
                                variant="filled"
                                color="primary"
                                onDelete={() => handleDeleteTag(tag)} // Permite remover
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
                ) : (
                    <>
                        {errorTags && <Alert severity="error">{errorTags}</Alert>}
                        {geminiQuotaExceededTags && (
                            <Alert severity="warning">
                                Cota da Gemini API excedida para tags. As sugestões podem não estar completas.
                            </Alert>
                        )}
                        <Grid container spacing={1}> 
                            {filteredAvailableTags.length === 0 && !errorTags && !geminiQuotaExceededTags ? ( 
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', my: 4 }}>
                                        Nenhuma tag disponível para sugestão.
                                        <Box component="span" sx={{ display: 'block', mt: 1 }}>
                                            Selecione uma categoria ou subcategoria para ver as tags sugeridas.
                                        </Box>
                                    </Typography>
                                </Grid>
                            ) : (
                                filteredAvailableTags.map((tag) => { 
                                    return ( 
                                        <Grid item key={tag._id}> {/* Usa _id como key para estabilidade */}
                                            <Chip
                                                label={tag.name}
                                                variant="outlined" // Sempre outline para tags disponíveis
                                                color="default" // Sempre default para tags disponíveis
                                                onClick={() => handleTagClick(tag)} // Adiciona ao clicar
                                                sx={{ m: 0.5, cursor: 'pointer' }}
                                            />
                                        </Grid>
                                    );
                                })
                            )}
                        </Grid>
                    </>
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

            {/* Modal de Criação de Tag (Admin) */}
            <Dialog open={openAdminTagModal} onClose={handleCloseAdminTagModal}>
                <DialogTitle>Criar Nova Tag</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nome da Tag"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newAdminTagName}
                        onChange={(e) => setNewAdminTagName(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                    {adminTagCreationError && (
                        <Alert severity="error" sx={{ mt: 2 }}>{adminTagCreationError}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAdminTagModal} disabled={adminTagCreationLoading}>Cancelar</Button>
                    <Button onClick={handleCreateAdminTag} disabled={adminTagCreationLoading}>
                        {adminTagCreationLoading ? <CircularProgress size={24} /> : 'Criar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

export default SelectTagsStep;
