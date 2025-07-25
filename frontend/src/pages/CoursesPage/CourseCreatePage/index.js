// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\index.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

// Importa os componentes de cada passo
import {
    SelectCategoryStep, 
    SelectSubCategoryStep,
    SelectTagsStep, 
    SelectImageStep,
    ReviewAndCreateStep,
    AdminAddCategoryModal,
    AdminAddSubCategoryModal,
    AdminAddTagModal,
    AdminClearSanityDataModal
} from './components'; 

import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext'; // Importando useAuth

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Define os passos do Stepper.
const steps = ['Selecione a Categoria', 'Selecione a Subcategoria', 'Selecione as Tags', 'Selecione a Imagem', 'Revisar e Criar']; 

// Definimos o limite de tags para SEO
const MIN_TAGS_REQUIRED = 1;
const MAX_TAGS_ALLOWED = 7;

function CourseCreatePage() {
    // Estados para o Stepper e os dados do curso
    const [activeStep, setActiveStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]); 
    const [selectedImage, setSelectedImage] = useState(null);

    // Estados para categorias
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [errorCategories, setErrorCategories] = useState(null);
    const [creatingCategoryOnSelect, setCreatingCategoryOnSelect] = useState(false); 
    
    // NOVO ESTADO: Para controlar se a busca inicial de categorias já foi tentada
    const [hasFetchedCategoriesInitially, setHasFetchedCategoriesInitially] = useState(false);

    // Estado para controlar a exibição do Alert (Snackbar)
    const [alertInfo, setAlertInfo] = useState({ message: null, severity: null });
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // Obtém o estado de autenticação, o token e a função de logout do contexto
    const { isAuthenticated, userToken, user, logout } = useAuth(); // Desestruturando logout
    const isAdmin = user?.isAdmin || false;

    // Hook para navegação programática
    const navigate = useNavigate();

    // Estados para os modais de criação
    const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false);
    const [openAddSubCategoryModal, setOpenAddSubCategoryModal] = useState(false);
    const [openAddTagModal, setOpenAddTagModal] = useState(false); 

    // Estados para o modal de limpeza de dados do Sanity.io
    const [openConfirmClearSanityModal, setOpenConfirmClearSanityModal] = useState(false);
    const [clearingSanityData, setClearingSanityData] = useState(false);

    // Ref para a função fetchTags do SelectTagsStep
    const selectTagsStepRef = useRef();

    // Função para exibir o Alert (Snackbar)
    const handleShowAlert = useCallback((message, severity) => {
        setAlertInfo({ message, severity });
        setSnackbarOpen(true); 
        setTimeout(() => setSnackbarOpen(false), 6000); 
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
            setHasFetchedCategoriesInitially(true); // Marca como tentado mesmo sem autenticação
            return;
        }

        setLoadingCategories(true);
        setErrorCategories(null); // Limpa erros anteriores
        try {
            const response = await axios.get(`${API_BASE_URL}/api/courses/create/top-categories`, {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
            
            setCategories(Array.isArray(response.data.categories) ? response.data.categories : []); 
            
            // Lógica aprimorada para definir errorCategories com base na resposta do backend
            if (response.data.geminiQuotaExceeded) {
                setErrorCategories('Cota da Gemini API excedida. As categorias sugeridas podem não estar completas.');
                handleShowAlert('Cota da Gemini API excedida. As categorias sugeridas podem não estar completas.', 'warning');
            } else if (!Array.isArray(response.data.categories) || response.data.categories.length === 0) {
                // Se não há categorias e a cota não foi excedida, significa que não há categorias no Sanity
                setErrorCategories('Nenhuma categoria encontrada no Sanity.io. Por favor, crie uma.');
                handleShowAlert('Nenhuma categoria encontrada no Sanity.io. Por favor, crie uma.', 'info');
            }

        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
            setCategories([]); // Garante que as categorias estejam vazias em caso de erro
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
            setHasFetchedCategoriesInitially(true); // Marca que a busca inicial foi tentada
        }
    }, [isAuthenticated, userToken, handleShowAlert]);

    useEffect(() => {
        // A busca só ocorrerá se:
        // 1. O usuário estiver autenticado.
        // 2. A lista de categorias estiver vazia.
        // 3. Não estiver carregando categorias no momento.
        // 4. Não houver um erro *persistente* que já foi identificado (ex: cota excedida, nenhuma categoria encontrada).
        // 5. A busca inicial ainda não foi tentada.
        if (isAuthenticated && categories.length === 0 && !loadingCategories && !errorCategories && !hasFetchedCategoriesInitially) {
            fetchCategories();
        }
    }, [isAuthenticated, categories.length, loadingCategories, errorCategories, hasFetchedCategoriesInitially, fetchCategories]);


    // --- Funções de Navegação e Seleção ---

    // Função para selecionar categoria e avançar (com criação automática)
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
                setCreatingCategoryOnSelect(false); 
                return; 
            } finally {
                setCreatingCategoryOnSelect(false);
            }
        } else {
            // Se não for uma categoria Gemini, apenas seleciona
            setSelectedCategory(category);
            handleShowAlert(`Categoria "${category.name}" selecionada.`, 'info');
        }

        // Avança para o próximo passo após a seleção/criação
        setSelectedSubcategory(null); 
        setSelectedTags([]); 
        setSelectedImage(null);
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }, [handleShowAlert, userToken, fetchCategories]);


    // Função para selecionar subcategoria e avançar
    const handleSubcategorySelectAndAdvance = useCallback((subCategory) => {
        setSelectedSubcategory(subCategory);
        setSelectedTags([]); 
        setSelectedImage(null);
        setActiveStep((prevActiveStep) => prevActiveStep + 1); 
        handleShowAlert(`Subcategoria "${subCategory.name}" selecionada. Avançando para Tags.`, 'info');
    }, [handleShowAlert]);

    // Função para selecionar tags e avançar
    const handleTagsSelectAndAdvance = useCallback((tags) => {
        setSelectedTags(tags);
        setSelectedImage(null);
        setActiveStep((prevActiveStep) => prevActiveStep + 1); 
        handleShowAlert(`Tags selecionadas (${tags.length}). Avançando para Imagem.`, 'info');
    }, [handleShowAlert]);

    // Função para selecionar imagem e avançar
    const handleImageSelectAndAdvance = useCallback((image) => {
        setSelectedImage(image);
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        handleShowAlert(`Imagem selecionada. Avançando para Revisão.`, 'info');
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
        handleCategorySelectAndAdvance(newCategory); 
    }, [fetchCategories, handleCategorySelectAndAdvance]);


    // --- Funções para o Modal de Criação de Subcategoria ---
    const handleOpenAddSubCategoryModal = useCallback(() => { 
        setOpenAddSubCategoryModal(true);
    }, []);

    const handleCloseAddSubCategoryModal = () => {
        setOpenAddSubCategoryModal(false);
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
        // Não precisamos recarregar as tags aqui, pois o SelectTagsStep fará isso
        // através do onTagsListUpdated que passaremos para o AdminAddTagModal.
    }, [handleShowAlert]);

    // Função para ser passada ao AdminAddTagModal para disparar o refresh de tags
    const handleTagsListUpdated = useCallback(() => {
        if (selectTagsStepRef.current && typeof selectTagsStepRef.current.fetchTags === 'function') {
            selectTagsStepRef.current.fetchTags();
        }
    }, []);

    // --- Funções para Limpar Dados do Sanity.io (Admin) ---
    const handleOpenClearSanityModal = useCallback(() => {
        setOpenConfirmClearSanityModal(true);
    }, []);

    const handleCloseClearSanityModal = useCallback(() => {
        setOpenConfirmClearSanityModal(false);
    }, []);

    const handleConfirmClearSanityData = useCallback(async () => {
        setClearingSanityData(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/admin/clear-sanity-data`, {}, {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
            handleShowAlert(response.data.message || 'Dados do Sanity.io limpos com sucesso! Você será desconectado.', 'success');
            
            // Resetar o estado do formulário após a limpeza completa
            setSelectedCategory(null);
            setSelectedSubcategory(null);
            setSelectedTags([]);
            setSelectedImage(null);
            setActiveStep(0);
            
            // Recarregar as categorias (e consequentemente subcategorias/tags)
            // Resetar hasFetchedCategoriesInitially para que fetchCategories seja chamado novamente
            setHasFetchedCategoriesInitially(false); 
            await fetchCategories();

            // NOVO: Deslogar o usuário após um pequeno delay para a mensagem ser vista
            // Aumentado o delay para 3 segundos para garantir que o Snackbar seja visível
            setTimeout(() => {
                logout(); // Chama a função de logout do AuthContext
                console.log("Logout forçado após limpeza de dados.");
                // Redirecionar explicitamente para a página de login
                navigate('/login'); 
            }, 3000); // Delay de 3 segundos

        } catch (error) {
            console.error('Erro ao limpar dados do Sanity.io:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || 'Erro ao limpar dados do Sanity.io. Verifique o console para detalhes.';
            handleShowAlert(errorMessage, 'error');
            
            // Em caso de erro na limpeza, ainda é uma boa ideia forçar o logout
            // para evitar problemas de sessão inconsistente, especialmente se o erro
            // foi devido a dados corrompidos ou inconsistentes no Sanity.
            setTimeout(() => {
                logout();
                console.log("Logout forçado devido a erro na limpeza de dados.");
                navigate('/login');
            }, 3000); // Delay de 3 segundos mesmo em caso de erro
        } finally {
            setClearingSanityData(false);
            handleCloseClearSanityModal();
        }
    }, [userToken, handleShowAlert, handleCloseClearSanityModal, fetchCategories, logout, navigate]); // Adicionado 'navigate' nas dependências


    // Renderiza o conteúdo de cada passo do Stepper
    const getStepContent = (step) => {
        switch (step) {
            case 0: // Selecionar Categoria
                return (
                    <>
                        <SelectCategoryStep
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategorySelectAndAdvance={handleCategorySelectAndAdvance} 
                            loading={loadingCategories || creatingCategoryOnSelect} 
                            error={errorCategories} // Passa o erro específico para o componente filho
                        />
                        {/* Exibe a mensagem de erro ou ausência de categorias aqui, se necessário */}
                        {!loadingCategories && hasFetchedCategoriesInitially && categories.length === 0 && errorCategories && (
                            <Alert severity={errorCategories.includes('Cota') ? 'warning' : 'info'} sx={{ mt: 2 }}>
                                {errorCategories}
                            </Alert>
                        )}
                        {isAdmin && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={handleOpenAddCategoryModal}
                                    disabled={creatingCategoryOnSelect} 
                                >
                                    Criar Nova Categoria (Admin)
                                </Button>
                            </Box>
                        )}
                    </>
                );
            case 1: // Selecionar Subcategoria
                return (
                    <SelectSubCategoryStep 
                        selectedCategory={selectedCategory}
                        selectedSubcategory={selectedSubcategory}
                        onSubcategorySelectAndAdvance={handleSubcategorySelectAndAdvance}
                        onGoBack={handleGoBack}
                        isAdmin={isAdmin}
                        onOpenAddSubCategoryModal={handleOpenAddSubCategoryModal}
                        onShowAlert={handleShowAlert}
                        userToken={userToken} 
                    />
                );
            case 2: // Selecionar Tags
                return (
                    <SelectTagsStep 
                        selectedCategory={selectedCategory}
                        selectedSubcategory={selectedSubcategory}
                        onTagsSelectAndAdvance={handleTagsSelectAndAdvance}
                        onGoBack={handleGoBack}
                        isAdmin={isAdmin}
                        onOpenAddTagModal={handleOpenAddTagModal}
                        onShowAlert={handleShowAlert}
                        userToken={userToken} 
                        minTags={MIN_TAGS_REQUIRED} 
                        maxTags={MAX_TAGS_ALLOWED}
                        selectedTags={selectedTags}
                        ref={selectTagsStepRef} 
                    />
                );
            case 3: // Selecionar Imagem
                return (
                    <SelectImageStep
                        selectedCategory={selectedCategory}
                        selectedSubcategory={selectedSubcategory}
                        selectedTags={selectedTags}
                        selectedImage={selectedImage}
                        onImageSelectAndAdvance={handleImageSelectAndAdvance}
                        onGoBack={handleGoBack}
                        onShowAlert={handleShowAlert}
                        userToken={userToken}
                    />
                );
            case 4: // Revisar e Criar
                return (
                    <ReviewAndCreateStep 
                        selectedCategory={selectedCategory}
                        selectedSubcategory={selectedSubcategory}
                        selectedTags={selectedTags}
                        selectedImage={selectedImage}
                        onGoBack={handleGoBack} 
                    />
                );
            default:
                return 'Passo desconhecido';
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                Criar Novo Curso (v0.1 - Foco em Categorias, Subcategorias, Tags e Imagem)
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

            {/* Botão de Limpeza de Dados do Sanity.io para Admin */}
            {isAdmin && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleOpenClearSanityModal}
                        disabled={clearingSanityData}
                        sx={{ px: 4, py: 1.5 }}
                    >
                        {clearingSanityData ? 'Limpando Sanity.io...' : 'Limpar Todos os Dados do Sanity.io (Admin)'}
                    </Button>
                </Box>
            )}

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
                parentCategory={selectedCategory} 
            />

            <AdminAddTagModal
                open={openAddTagModal}
                onClose={handleCloseAddTagModal}
                isAuthenticated={isAuthenticated}
                userToken={userToken}
                onTagCreated={handleAdminTagCreated}
                onShowAlert={handleShowAlert}
                selectedCategory={selectedCategory} 
                selectedSubcategory={selectedSubcategory} 
                onTagsListUpdated={handleTagsListUpdated} 
            />

            {/* Modal de Confirmação para Limpeza de Dados do Sanity.io */}
            <AdminClearSanityDataModal
                open={openConfirmClearSanityModal}
                onClose={handleCloseClearSanityModal}
                onConfirm={handleConfirmClearSanityData}
                clearingData={clearingSanityData}
                onShowAlert={handleShowAlert}
            />
        </Container>
    );
}

export default CourseCreatePage;
