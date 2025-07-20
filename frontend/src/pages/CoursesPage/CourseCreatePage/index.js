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
    Button
} from '@mui/material';

// Importa os componentes de cada passo
import {
    SelectCategoryStep, 
    SelectSubCategoryStep,
    SelectTagsStep,
    ReviewAndCreateStep,
    AdminAddCategoryModal
} from './components'; 

import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Define os passos do Stepper. O segundo passo agora é "Selecione a Subcategoria".
const steps = ['Selecione a Categoria', 'Selecione a Subcategoria', 'Passo 3 (Em Breve)', 'Passo 4 (Em Breve)'];

function CourseCreatePage() {
    // Estados para o Stepper e o Passo 1 (Categorias)
    const [activeStep, setActiveStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [errorCategories, setErrorCategories] = useState(null);

    // Estado para controlar a exibição do Alert
    const [alertInfo, setAlertInfo] = useState({ message: null, severity: null });

    // Obtém o estado de autenticação e o token do contexto, incluindo isAdmin
    const { isAuthenticated, userToken, user } = useAuth(); 
    const isAdmin = user?.isAdmin || false;

    // Estados para o modal de criação de categoria
    const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false);

    // Função para exibir o Alert
    const handleShowAlert = useCallback((message, severity) => {
        setAlertInfo({ message, severity });
        setTimeout(() => setAlertInfo({ message: null, severity: null }), 6000);
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
            
            // Certifica-se de que response.data.categories é um array
            setCategories(Array.isArray(response.data.categories) ? response.data.categories : []); 
            
            if (response.data.geminiQuotaExceeded) {
                handleShowAlert('Cota da Gemini API excedida. As categorias sugeridas podem não estar completas.', 'warning');
            }

        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
            // NOVO: Resetar categories para um array vazio em caso de erro
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


    // Função para selecionar categoria e avançar
    const handleCategorySelectAndAdvance = useCallback((category) => {
        setSelectedCategory(category);
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        handleShowAlert(`Categoria "${category.name}" selecionada. Avançando para Subcategorias.`, 'info');
    }, [handleShowAlert]);

    // Funções para o Modal de Criação de Categoria
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
                            loading={loadingCategories}
                            error={errorCategories}
                        />
                        {isAdmin && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={handleOpenAddCategoryModal}
                                >
                                    Criar Nova Categoria (Admin)
                                </Button>
                            </Box>
                        )}
                    </>
                );
            case 1:
                // NOVO: Passando selectedCategory para SelectSubCategoryStep
                return (
                    <SelectSubCategoryStep selectedCategory={selectedCategory} />
                );
            case 2:
                return (
                    <SelectTagsStep />
                );
            case 3:
                return (
                    <ReviewAndCreateStep />
                );
            default:
                return 'Passo desconhecido';
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                Criar Novo Curso (v0.1 - Foco em Categorias e Subcategorias)
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

            {alertInfo.message && (
                <Alert severity={alertInfo.severity} sx={{ mt: 2, width: '100%' }}>
                    {alertInfo.message}
                </Alert>
            )}

            <AdminAddCategoryModal
                open={openAddCategoryModal}
                onClose={handleCloseAddCategoryModal}
                isAuthenticated={isAuthenticated}
                userToken={userToken}
                onCategoryCreated={handleAdminCategoryCreated}
                onShowAlert={handleShowAlert}
            />
        </Container>
    );
}

export default CourseCreatePage;
