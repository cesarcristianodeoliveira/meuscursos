// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectSubCategoryStep.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
    Box, 
    Typography, 
    Alert, 
    CircularProgress, 
    List, 
    ListItemButton, 
    ListItemText,
    Button
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function SelectSubCategoryStep({ 
    selectedCategory, 
    selectedSubcategory, // Adicionado para manter o estado de seleção
    onSubcategorySelectAndAdvance, 
    onGoBack, 
    isAdmin, 
    onOpenAddSubCategoryModal,
    onShowAlert,
    userToken // Recebe o token do pai
}) {
    const [subcategories, setSubcategories] = useState([]);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [errorSubcategories, setErrorSubcategories] = useState(null); // Para erros de rede/servidor ou ausência TOTAL
    // NOVO ESTADO: Para o aviso de cota da Gemini para subcategorias
    const [geminiQuotaExceededSubcategories, setGeminiQuotaExceededSubcategories] = useState(false);
    const [creatingSubcategoryOnSelect, setCreatingSubcategoryOnSelect] = useState(false); // Novo estado para carregamento ao criar

    // Função para buscar subcategorias do backend
    const fetchSubcategories = useCallback(async () => {
        if (!selectedCategory || !userToken) {
            // Se não há categoria selecionada ou usuário não autenticado, limpa e define erro
            setSubcategories([]);
            setErrorSubcategories('Nenhuma categoria principal selecionada ou usuário não autenticado.');
            setGeminiQuotaExceededSubcategories(false); // Garante que o aviso esteja limpo
            return;
        }

        setLoadingSubcategories(true);
        setErrorSubcategories(null); // Limpa erros anteriores
        setGeminiQuotaExceededSubcategories(false); // Limpa aviso de cota anterior
        try {
            const response = await axios.get(`${API_BASE_URL}/api/subcategories`, { // Rota ajustada
                params: {
                    categoryId: selectedCategory._id,
                    categoryName: selectedCategory.name // Passa o nome para o backend
                },
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
            
            setSubcategories(Array.isArray(response.data.subcategories) ? response.data.subcategories : []); 
            
            // Lógica aprimorada para definir o aviso de cota e erros de ausência de subcategorias
            if (response.data.geminiQuotaExceeded) {
                setGeminiQuotaExceededSubcategories(true); // Define o aviso de cota separadamente
                onShowAlert('Cota da Gemini API excedida para subcategorias. As sugestões podem não estar completas.', 'warning');
            } 
            
            // Se não houver subcategorias do Sanity E não for um aviso de cota da Gemini
            // (ou seja, a lista está realmente vazia do Sanity e não há sugestões)
            if ((!Array.isArray(response.data.subcategories) || response.data.subcategories.length === 0) && !response.data.geminiQuotaExceeded) {
                setErrorSubcategories('Nenhuma subcategoria encontrada no Sanity.io para esta categoria. Por favor, crie uma.');
                onShowAlert('Nenhuma subcategoria encontrada no Sanity.io. Por favor, crie uma.', 'info');
            }

        } catch (err) {
            console.error('Erro ao buscar subcategorias:', err);
            setSubcategories([]);
            setGeminiQuotaExceededSubcategories(false); // Limpa o aviso em caso de erro de rede/servidor
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setErrorSubcategories('Erro de rede: O servidor backend pode não estar rodando ou está inacessível.');
                    onShowAlert('Erro de conexão com o servidor de subcategorias. Tente novamente.', 'error');
                } else if (err.response) {
                    setErrorSubcategories(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Erro desconhecido.'}`);
                    onShowAlert(`Erro: ${err.response.data.message || 'Algo deu errado no servidor de subcategorias.'}`, 'error');
                }
            } else {
                setErrorSubcategories('Ocorreu um erro desconhecido ao carregar subcategorias.');
                onShowAlert('Ocorreu um erro inesperado ao carregar subcategorias.', 'error');
            }
        } finally {
            setLoadingSubcategories(false);
        }
    }, [selectedCategory, userToken, onShowAlert]);

    // Efeito para carregar subcategorias quando a categoria selecionada muda
    useEffect(() => {
        fetchSubcategories();
    }, [fetchSubcategories]);

    // Lógica de seleção e avanço (incluindo criação automática para Gemini IDs)
    const handleSelectAndAdvance = useCallback(async (subCategory) => {
        if (subCategory._id.startsWith('gemini-')) {
            setCreatingSubcategoryOnSelect(true);
            try {
                const response = await axios.post(`${API_BASE_URL}/api/subcategories`, 
                    { 
                        title: subCategory.name.trim(),
                        parentCategoryId: selectedCategory._id,
                        parentCategoryName: selectedCategory.name
                    },
                    { 
                        headers: { 
                            Authorization: `Bearer ${userToken}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );
                const createdSubcategory = response.data; // Backend retorna o _id real do Sanity
                
                onShowAlert(`Subcategoria "${createdSubcategory.name}" criada e selecionada com sucesso!`, 'success');
                await fetchSubcategories(); // Recarrega as subcategorias para incluir a recém-criada
                onSubcategorySelectAndAdvance(createdSubcategory); // Notifica o pai com a subcategoria real

            } catch (error) {
                console.error('Erro ao criar subcategoria ao selecionar:', error.response?.data || error.message);
                const errorMessage = error.response?.data?.message || 'Erro ao criar subcategoria. Tente novamente.';
                onShowAlert(errorMessage, 'error');
                setCreatingSubcategoryOnSelect(false);
                return;
            } finally {
                setCreatingSubcategoryOnSelect(false);
            }
        } else {
            // Se não for uma subcategoria Gemini, apenas seleciona e avança
            onSubcategorySelectAndAdvance(subCategory);
            onShowAlert(`Subcategoria "${subCategory.name}" selecionada.`, 'info');
        }
    }, [selectedCategory, userToken, onShowAlert, fetchSubcategories, onSubcategorySelectAndAdvance]);


    if (!selectedCategory) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="warning">
                    Nenhuma categoria principal selecionada. Por favor, volte ao Passo 1.
                </Alert>
                <Button variant="outlined" onClick={onGoBack} sx={{ mt: 2 }}>
                    Voltar para Categorias
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
                Passo 2: Selecione a Subcategoria para "{selectedCategory.name}"
            </Typography>

            {loadingSubcategories || creatingSubcategoryOnSelect ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Exibe erros de rede/servidor ou outros erros críticos (se houver) */}
                    {errorSubcategories && (
                        <Alert severity="error" sx={{ m: 2 }}>{errorSubcategories}</Alert>
                    )}

                    {/* NOVO: Exibe o aviso de cota da Gemini API para subcategorias */}
                    {geminiQuotaExceededSubcategories && (
                        <Alert severity="warning" sx={{ m: 2 }}>
                            Cota da Gemini API excedida. As subcategorias sugeridas podem não estar completas.
                        </Alert>
                    )}

                    <List component="nav" aria-label="course subcategories">
                        {subcategories.length === 0 ? (
                            /* Exibe esta mensagem APENAS se não houver subcategorias no Sanity.io
                               E não houver um erro crítico (como erro de rede/servidor)
                               E a cota da Gemini API NÃO estiver excedida (pois se estiver, o aviso da Gemini já cobre a falta de sugestões).
                               Isso significa que o Sanity.io está realmente vazio de subcategorias para esta categoria. */
                            !errorSubcategories && !geminiQuotaExceededSubcategories && (
                                <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                                    Nenhuma subcategoria disponível para esta categoria no Sanity.io.
                                </Typography>
                            )
                        ) : (
                            subcategories.map((subCat) => (
                                <ListItemButton
                                    key={subCat._id}
                                    selected={selectedSubcategory && selectedSubcategory._id === subCat._id}
                                    onClick={() => handleSelectAndAdvance(subCat)}
                                    sx={{
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: 'primary.dark',
                                            },
                                        },
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                        borderRadius: '4px',
                                        margin: '4px 8px',
                                    }}
                                >
                                    <ListItemText primary={subCat.name} />
                                </ListItemButton>
                            ))
                        )}
                    </List>
                </>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', p: 2 }}>
                <Button variant="outlined" onClick={onGoBack}>
                    Voltar para Categorias
                </Button>
                {isAdmin && (
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={onOpenAddSubCategoryModal}
                        disabled={loadingSubcategories || creatingSubcategoryOnSelect}
                    >
                        Criar Nova Subcategoria (Admin)
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default SelectSubCategoryStep;
