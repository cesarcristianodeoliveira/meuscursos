// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectSubCategoryStep.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../../../contexts/AuthContext'; // Ajuste o caminho se necessário

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function SelectSubCategoryStep({ 
    selectedCategory, 
    onSubcategorySelectAndAdvance, // Callback para selecionar subcategoria e avançar
    onGoBack, // Callback para voltar ao passo anterior
    isAdmin, // Prop para verificar se é admin
    onOpenAddSubCategoryModal, // Callback para abrir o modal de adicionar subcategoria
    onShowAlert // Função para exibir alertas
}) {
    const [subcategories, setSubcategories] = useState([]);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [errorSubcategories, setErrorSubcategories] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);

    const { isAuthenticated, userToken } = useAuth();

    // Função para buscar subcategorias do backend
    const fetchSubcategories = useCallback(async () => {
        if (!isAuthenticated || !selectedCategory || !selectedCategory._id) {
            setErrorSubcategories("Selecione uma categoria principal para ver as subcategorias.");
            setSubcategories([]); // Garante que a lista esteja vazia
            return;
        }

        setLoadingSubcategories(true);
        setErrorSubcategories(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/courses/create/subcategories`, {
                params: {
                    categoryId: selectedCategory._id,
                    categoryName: selectedCategory.name // Passa o nome para o backend usar no prompt Gemini
                },
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
            
            // Certifica-se de que response.data.subcategories é um array
            setSubcategories(Array.isArray(response.data.subcategories) ? response.data.subcategories : []); 
            
            if (response.data.geminiQuotaExceeded) {
                onShowAlert('Cota da Gemini API excedida para subcategorias. As sugestões podem não estar completas.', 'warning');
            }

        } catch (err) {
            console.error('Erro ao buscar subcategorias:', err);
            setSubcategories([]); // Resetar subcategories para um array vazio em caso de erro
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setErrorSubcategories('Erro de rede: O servidor backend pode não estar rodando ou está inacessível. Verifique se o backend está iniciado na porta 3001.');
                    onShowAlert('Erro de conexão com o servidor de subcategorias. Tente novamente.', 'error');
                } else if (err.response) {
                    setErrorSubcategories(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Erro desconhecido.'}`);
                    onShowAlert(`Erro ao buscar subcategorias: ${err.response.data.message || 'Algo deu errado no servidor.'}`, 'error');
                }
            } else {
                setErrorSubcategories('Ocorreu um erro desconhecido ao carregar subcategorias.');
                onShowAlert('Ocorreu um erro inesperado ao carregar subcategorias.', 'error');
            }
        } finally {
            setLoadingSubcategories(false);
        }
    }, [isAuthenticated, selectedCategory, userToken, onShowAlert]);

    // Efeito para carregar as subcategorias quando a categoria selecionada muda
    useEffect(() => {
        if (selectedCategory && isAuthenticated) {
            fetchSubcategories();
        } else {
            setSubcategories([]); // Limpa subcategorias se nenhuma categoria pai estiver selecionada
            setSelectedSubcategory(null); // Limpa a subcategoria selecionada
            setErrorSubcategories(null); // Limpa erros
        }
    }, [selectedCategory, isAuthenticated, fetchSubcategories]);

    // Handler para selecionar uma subcategoria e avançar
    const handleSubcategorySelect = useCallback((subCategory) => {
        setSelectedSubcategory(subCategory);
        onSubcategorySelectAndAdvance(subCategory); // Chama o callback para avançar no Stepper
        onShowAlert(`Subcategoria "${subCategory.name}" selecionada.`, 'info');
    }, [onSubcategorySelectAndAdvance, onShowAlert]);

    // Handler para o botão "Voltar"
    const handleGoBackClick = () => {
        onGoBack(); // Chama o callback para voltar ao passo anterior
    };

    // Handler para o botão "Adicionar Nova Subcategoria (Admin)"
    const handleOpenAddSubCategoryModalClick = () => {
        onOpenAddSubCategoryModal(selectedCategory); // Passa a categoria pai para o modal
    };

    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
                Selecione a Subcategoria do Curso (Categoria: {selectedCategory ? selectedCategory.name : 'Nenhuma'})
            </Typography>

            {loadingSubcategories ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                    <CircularProgress />
                </Box>
            ) : errorSubcategories ? (
                <Alert severity="error" sx={{ m: 2 }}>{errorSubcategories}</Alert>
            ) : (
                <>
                    <List component="nav" aria-label="course subcategories">
                        {subcategories.length === 0 ? (
                            <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                                Nenhuma subcategoria disponível para esta categoria.
                            </Typography>
                        ) : (
                            subcategories.map((subCategory) => (
                                <ListItemButton
                                    key={subCategory._id}
                                    selected={selectedSubcategory && selectedSubcategory._id === subCategory._id}
                                    onClick={() => handleSubcategorySelect(subCategory)}
                                    sx={{
                                        '&.Mui-selected': {
                                            backgroundColor: 'secondary.main', // Cor de destaque para selecionado
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: 'secondary.dark',
                                            },
                                        },
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                        borderRadius: '4px',
                                        margin: '4px 8px',
                                    }}
                                >
                                    <ListItemText primary={subCategory.name} />
                                </ListItemButton>
                            ))
                        )}
                    </List>
                    {isAdmin && (
                        <Box sx={{ mt: 2, textAlign: 'center', p: 2 }}>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={handleOpenAddSubCategoryModalClick}
                                disabled={!selectedCategory} // Desabilita se nenhuma categoria pai estiver selecionada
                            >
                                Adicionar Nova Subcategoria (Admin)
                            </Button>
                        </Box>
                    )}
                </>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 4, p: 2 }}>
                <Button variant="outlined" onClick={handleGoBackClick}>
                    Voltar para Categorias
                </Button>
            </Box>
        </Box>
    );
}

export default SelectSubCategoryStep;
