// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectTagsStep.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    // List, // Não é realmente usado para chips, removido para clareza
    Chip, // Para exibir as tags
    CircularProgress,
    Alert,
    Button,
    Stack // Para organizar os chips
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../../../contexts/AuthContext'; // Ajuste o caminho se necessário

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function SelectTagsStep({ 
    selectedCategory, 
    selectedSubcategory, 
    onTagsSelectAndAdvance, // Callback para selecionar tags e avançar
    onGoBack, // Callback para voltar ao passo anterior
    isAdmin, // Prop para verificar se é admin
    onOpenAddTagModal, // Callback para abrir o modal de adicionar tag
    onShowAlert, // Função para exibir alertas
    minTags, // Prop para o mínimo de tags
    maxTags // Prop para o máximo de tags
}) {
    const [availableTags, setAvailableTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const [errorTags, setErrorTags] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]); // Array de tags selecionadas

    const { isAuthenticated, userToken } = useAuth();

    // Função para buscar tags do backend
    const fetchTags = useCallback(async () => {
        if (!isAuthenticated) {
            setErrorTags("Você precisa estar logado para criar um curso.");
            setAvailableTags([]);
            return;
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
            // Se nem categoria nem subcategoria, o backend deve retornar tags gerais

            const response = await axios.get(`${API_BASE_URL}/api/courses/create/tags`, {
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
    }, [isAuthenticated, selectedCategory, selectedSubcategory, userToken, onShowAlert]);

    // Efeito para carregar as tags quando a categoria ou subcategoria selecionada muda
    useEffect(() => {
        if (isAuthenticated) {
            fetchTags();
        } else {
            setAvailableTags([]);
            setSelectedTags([]);
            setErrorTags(null);
        }
    }, [isAuthenticated, selectedCategory, selectedSubcategory, fetchTags]);

    // Handler para alternar a seleção de uma tag
    const handleTagClick = useCallback((tag) => {
        setSelectedTags((prevSelectedTags) => {
            const isSelected = prevSelectedTags.some(t => t._id === tag._id);

            if (isSelected) {
                // Remove a tag se já estiver selecionada
                return prevSelectedTags.filter(t => t._id !== tag._id);
            } else {
                // Adiciona a tag se não estiver selecionada e não exceder o limite
                if (prevSelectedTags.length < maxTags) { // Usa maxTags da prop
                    return [...prevSelectedTags, tag];
                } else {
                    onShowAlert(`Você pode selecionar no máximo ${maxTags} tags.`, 'warning'); // Usa maxTags da prop
                    return prevSelectedTags; // Não adiciona se exceder o limite
                }
            }
        });
    }, [onShowAlert, maxTags]); // Adiciona maxTags às dependências

    // Handler para remover uma tag usando o 'onDelete' do Chip
    const handleDeleteTag = useCallback((tagToDelete) => {
        setSelectedTags((prevSelectedTags) => 
            prevSelectedTags.filter(tag => tag._id !== tagToDelete._id)
        );
    }, []);

    // Handler para o botão "Voltar"
    const handleGoBackClick = () => {
        onGoBack(); // Chama o callback para voltar ao passo anterior
    };

    // Handler para o botão "Adicionar Nova Tag (Admin)"
    const handleOpenAddTagModalClick = () => {
        onOpenAddTagModal(); // Abre o modal sem passar categoria/subcategoria (tags são globais)
    };

    // Handler para o botão "Próximo"
    const handleNextClick = () => {
        if (selectedTags.length < minTags) { // Usa minTags da prop
            onShowAlert(`Por favor, selecione no mínimo ${minTags} tag(s).`, 'warning'); // Usa minTags da prop
            return;
        }
        onTagsSelectAndAdvance(selectedTags); // Chama o callback para avançar no Stepper
    };

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

            {loadingTags ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                    <CircularProgress />
                </Box>
            ) : errorTags ? (
                <Alert severity="error" sx={{ m: 2 }}>{errorTags}</Alert>
            ) : (
                <>
                    {/* Tags Selecionadas */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Tags Selecionadas ({selectedTags.length}/{maxTags}):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {selectedTags.length === 0 ? (
                                <Typography variant="body2" color="textSecondary">
                                    Nenhuma tag selecionada.
                                </Typography>
                            ) : (
                                selectedTags.map((tag) => (
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
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {availableTags.length === 0 ? (
                                <Typography variant="body2" color="textSecondary">
                                    Nenhuma tag disponível para sugestão.
                                </Typography>
                            ) : (
                                availableTags.map((tag) => {
                                    const isSelected = selectedTags.some(t => t._id === tag._id);
                                    return (
                                        <Chip
                                            key={tag._id}
                                            label={tag.name}
                                            variant={isSelected ? "filled" : "outlined"}
                                            color={isSelected ? "primary" : "default"}
                                            onClick={() => handleTagClick(tag)}
                                            sx={{ m: 0.5, cursor: 'pointer' }}
                                        />
                                    );
                                })
                            )}
                        </Stack>
                    </Box>

                    {isAdmin && (
                        <Box sx={{ mt: 2, textAlign: 'center', p: 2 }}>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={handleOpenAddTagModalClick}
                            >
                                Adicionar Nova Tag (Admin)
                            </Button>
                        </Box>
                    )}
                </>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, p: 2 }}>
                <Button variant="outlined" onClick={handleGoBackClick}>
                    Voltar para Subcategorias
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleNextClick}
                    disabled={selectedTags.length < minTags || selectedTags.length > maxTags} // Usa minTags e maxTags da prop
                >
                    Próximo
                </Button>
            </Box>
        </Box>
    );
}

export default SelectTagsStep;
