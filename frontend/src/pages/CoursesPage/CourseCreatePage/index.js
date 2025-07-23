// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\index.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    Alert,
    Button,
    Snackbar,
    // CircularProgress // REMOVIDO: 'CircularProgress' não é usado diretamente neste componente.
} from '@mui/material';

// Importa os componentes de cada passo
import {
    SelectCategoryStep, 
    SelectSubCategoryStep,
    SelectTagsStep, // Componente para selecionar tags
    ReviewAndCreateStep,
    AdminAddCategoryModal,
    AdminAddSubCategoryModal,
    AdminAddTagModal // Componente do modal de adição de tag
} from './components'; 

import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Define os passos do Stepper.
const steps = ['Selecione a Categoria', 'Selecione a Subcategoria', 'Selecione as Tags', 'Revisar e Criar']; 

// Definimos o limite de tags para SEO
const MIN_TAGS_REQUIRED = 1;
const MAX_TAGS_ALLOWED = 7;

function CourseCreatePage() {
    // Estados para o Stepper e os dados do curso
    const [activeStep, setActiveStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]); // Este estado é usado para armazenar as tags selecionadas e será passado para o ReviewAndCreateStep

    // Estados para categorias
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [errorCategories, setErrorCategories] = useState(null);
    const [creatingCategoryOnSelect, setCreatingCategoryOnSelect] = useState(false); // NOVO: Estado para carregamento ao criar categoria ao selecionar

    // Estado para controlar a exibição do Alert (Snackbar)
    const [alertInfo, setAlertInfo] = useState({ message: null, severity: null });
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // Obtém o estado de autenticação e o token do contexto, incluindo isAdmin
    const { isAuthenticated, userToken, user } = useAuth(); 
    const isAdmin = user?.isAdmin || false;

    // Estados para os modais de criação
    const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false);
    const [openAddSubCategoryModal, setOpenAddSubCategoryModal] = useState(false);
    const [parentCategoryForSubModal, setParentCategoryForSubModal] = useState(null);
    const [openAddTagModal, setOpenAddTagModal] = useState(false); 

    // Função para exibir o Alert (Snackbar)
    const handleShowAlert = useCallback((message, severity) => {
        setAlertInfo({ message, severity });
        setSnackbarOpen(true); // Abre o Snackbar
        setTimeout(() => setSnackbarOpen(false), 6000); // Fecha após 6 segundos
    }, []);

    // Função para fechar o Snackbar
    const handleSnackbarClose = useCallback((event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    }, []);

    // Função para buscar categorias do backend
    const fetchCategories = useCallback(async () => {
        if (!isAuthenticated) {
            setErrorCategories("Você precisa estar logado para criar um curso.");
            handleShowAlert("Você precisa estar logado para criar um curso.", "warning");
            return;
        }

        setLoadingCategories(true);
        setErrorCategories(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/courses/create/top-categories`, {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
            
            // A resposta agora é um objeto com 'categories' e 'geminiQuotaExceeded'
            setCategories(Array.isArray(response.data.categories) ? response.data.categories : []); 
            
            if (response.data.geminiQuotaExceeded) {
                handleShowAlert('Cota da Gemini API excedida. As categorias sugeridas podem não estar completas.', 'warning');
            }

        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
            setCategories([]); 
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setErrorCategories('Erro de rede: O servidor backend pode não estar rodando ou está inacessível. Verifique se o backend está iniciado na porta 3001.');
                    handleShowAlert('Erro de conexão com o servidor. Tente novamente.', 'error');
                } else if (err.response) {
                    setErrorCategories(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Erro desconhecido.'}`);
                    handleShowAlert(`Erro: ${err.response.data.message || 'Algo deu errado no servidor.'}`, 'error');
                }
            } else {
                setErrorCategories('Ocorreu um erro desconhecido ao carregar categorias.');
                handleShowAlert('Ocorreu um erro inesperado.', 'error');
            }
        } finally {
            setLoadingCategories(false);
        }
    }, [isAuthenticated, userToken, handleShowAlert]);

    useEffect(() => {
        if (isAuthenticated && categories.length === 0 && !loadingCategories && !errorCategories) {
            fetchCategories();
        }
    }, [isAuthenticated, categories.length, loadingCategories, errorCategories, fetchCategories]);


    // --- Funções de Navegação e Seleção ---

    // NOVO: Função para selecionar categoria e avançar (com criação automática)
    const handleCategorySelectAndAdvance = useCallback(async (category) => {
        // Se a categoria selecionada é uma sugestão da Gemini (ID começa com 'gemini-')
        if (category._id.startsWith('gemini-')) {
            setCreatingCategoryOnSelect(true);
            try {
                const response = await axios.post(`${API_BASE_URL}/api/categories`, 
                    { title: category.name.trim() },
                    { 
                        headers: { 
                            Authorization: `Bearer ${userToken}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );
                const createdCategory = response.data; // Backend retorna o _id real do Sanity
                
                // Atualiza a categoria selecionada para usar o ID real do Sanity
                setSelectedCategory(createdCategory); 
                handleShowAlert(`Categoria "${createdCategory.name}" criada e selecionada com sucesso!`, 'success');
                await fetchCategories(); // Recarrega as categorias para incluir a recém-criada do Sanity

            } catch (error) {
                console.error('Erro ao criar categoria ao selecionar:', error.response?.data || error.message);
                const errorMessage = error.response?.data?.message || 'Erro ao criar categoria. Tente novamente.';
                handleShowAlert(errorMessage, 'error');
                setCreatingCategoryOnSelect(false); // Reseta o estado de carregamento
                return; // Não avança se a criação falhar
            } finally {
                setCreatingCategoryOnSelect(false);
            }
        } else {
            // Se não for uma categoria Gemini, apenas seleciona
            setSelectedCategory(category);
            handleShowAlert(`Categoria "${category.name}" selecionada.`, 'info');
        }

        // Avança para o próximo passo após a seleção/criação
        setSelectedSubcategory(null); // Reseta a subcategoria ao mudar a categoria principal
        setSelectedTags([]); // Reseta as tags ao mudar a categoria principal
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        handleShowAlert(`Avançando para Subcategorias.`, 'info');

    }, [handleShowAlert, userToken, fetchCategories]);


    // Função para selecionar subcategoria e avançar
    const handleSubcategorySelectAndAdvance = useCallback((subCategory) => {
        setSelectedSubcategory(subCategory);
        setSelectedTags([]); // Reseta as tags ao mudar a subcategoria
        setActiveStep((prevActiveStep) => prevActiveStep + 1); // Avança para o próximo passo (tags)
        handleShowAlert(`Subcategoria "${subCategory.name}" selecionada. Avançando para Tags.`, 'info');
    }, [handleShowAlert]);

    // Função para selecionar tags e avançar
    const handleTagsSelectAndAdvance = useCallback((tags) => {
        setSelectedTags(tags);
        setActiveStep((prevActiveStep) => prevActiveStep + 1); // Avança para o próximo passo (revisão)
        handleShowAlert(`Tags selecionadas (${tags.length}). Avançando para Revisão.`, 'info');
    }, [handleShowAlert]);

    // Função para voltar ao passo anterior
    const handleGoBack = useCallback(() => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }, []);


    // --- Funções para o Modal de Criação de Categoria ---
    const handleOpenAddCategoryModal = () => {
        setOpenAddCategoryModal(true);
    };

    const handleCloseAddCategoryModal = () => {
        setOpenAddCategoryModal(false);
    };

    // Callback quando uma categoria é criada no modal do admin
    const handleAdminCategoryCreated = useCallback(async (newCategory) => {
        await fetchCategories(); 
        handleCategorySelectAndAdvance(newCategory); // Usa a mesma lógica de seleção e avanço
    }, [fetchCategories, handleCategorySelectAndAdvance]);


    // --- Funções para o Modal de Criação de Subcategoria ---
    const handleOpenAddSubCategoryModal = useCallback((parentCat) => {
        setParentCategoryForSubModal(parentCat);
        setOpenAddSubCategoryModal(true);
    }, []);

    const handleCloseAddSubCategoryModal = () => {
        setOpenAddSubCategoryModal(false);
        setParentCategoryForSubModal(null); // Limpa a categoria pai ao fechar
    };

    // Callback quando uma subcategoria é criada no modal do admin
    const handleAdminSubcategoryCreated = useCallback((newSubcategory) => {
        setSelectedSubcategory(newSubcategory); 
        handleSubcategorySelectAndAdvance(newSubcategory); 
    }, [handleSubcategorySelectAndAdvance]);


    // --- Funções para o Modal de Criação de Tags ---
    const handleOpenAddTagModal = useCallback(() => {
        setOpenAddTagModal(true);
    }, []);

    const handleCloseAddTagModal = () => {
        setOpenAddTagModal(false);
    };

    // Callback quando uma tag é criada no modal do admin
    const handleAdminTagCreated = useCallback((newTag) => {
        handleShowAlert(`Tag "${newTag.name}" criada com sucesso!`, 'success');
    }, [handleShowAlert]);


    // Renderiza o conteúdo de cada passo do Stepper
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <>
                        <SelectCategoryStep
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategorySelectAndAdvance={handleCategorySelectAndAdvance} 
                            loading={loadingCategories || creatingCategoryOnSelect} // NOVO: Inclui estado de criação
                            error={errorCategories}
                        />
                        {isAdmin && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={handleOpenAddCategoryModal}
                                    disabled={creatingCategoryOnSelect} // Desabilita enquanto cria ao selecionar
                                >
                                    Criar Nova Categoria (Admin)
                                </Button>
                            </Box>
                        )}
                    </>
                );
            case 1:
                return (
                    <SelectSubCategoryStep 
                        selectedCategory={selectedCategory}
                        selectedSubcategory={selectedSubcategory}
                        onSubcategorySelectAndAdvance={handleSubcategorySelectAndAdvance}
                        onGoBack={handleGoBack}
                        isAdmin={isAdmin}
                        onOpenAddSubCategoryModal={handleOpenAddSubCategoryModal}
                        onShowAlert={handleShowAlert}
                    />
                );
            case 2:
                // Renderiza SelectTagsStep com props
                return (
                    <SelectTagsStep 
                        selectedCategory={selectedCategory}
                        selectedSubcategory={selectedSubcategory}
                        onTagsSelectAndAdvance={handleTagsSelectAndAdvance}
                        onGoBack={handleGoBack}
                        isAdmin={isAdmin}
                        onOpenAddTagModal={handleOpenAddTagModal}
                        onShowAlert={handleShowAlert}
                        minTags={MIN_TAGS_REQUIRED} // Passa a constante para o componente
                        maxTags={MAX_TAGS_ALLOWED} // Passa a constante para o componente
                    />
                );
            case 3:
                // AGORA PASSAMOS AS PROPS PARA O ReviewAndCreateStep
                return (
                    <ReviewAndCreateStep 
                        selectedCategory={selectedCategory}
                        selectedSubcategory={selectedSubcategory}
                        selectedTags={selectedTags}
                        onGoBack={handleGoBack} // Permite voltar do passo de revisão
                        // onCreateCourse={handleCreateCourse} // Adicionar esta prop quando a função de criação for implementada
                    />
                );
            default:
                return 'Passo desconhecido';
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                Criar Novo Curso (v0.1 - Foco em Categorias, Subcategorias e Tags)
            </Typography>

            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: '8px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {getStepContent(activeStep)}
            </Box>

            {/* Snackbar para exibir alertas */}
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={alertInfo.severity} sx={{ width: '100%' }}>
                    {alertInfo.message}
                </Alert>
            </Snackbar>

            <AdminAddCategoryModal
                open={openAddCategoryModal}
                onClose={handleCloseAddCategoryModal}
                isAuthenticated={isAuthenticated}
                userToken={userToken}
                onCategoryCreated={handleAdminCategoryCreated}
                onShowAlert={handleShowAlert}
            />

            <AdminAddSubCategoryModal
                open={openAddSubCategoryModal}
                onClose={handleCloseAddSubCategoryModal}
                isAuthenticated={isAuthenticated}
                userToken={userToken}
                onSubcategoryCreated={handleAdminSubcategoryCreated}
                onShowAlert={handleShowAlert}
                parentCategory={parentCategoryForSubModal} 
            />

            <AdminAddTagModal
                open={openAddTagModal}
                onClose={handleCloseAddTagModal}
                isAuthenticated={isAuthenticated}
                userToken={userToken}
                onTagCreated={handleAdminTagCreated}
                onShowAlert={handleShowAlert}
                selectedCategory={selectedCategory}
            />
        </Container>
    );
}

export default CourseCreatePage;
