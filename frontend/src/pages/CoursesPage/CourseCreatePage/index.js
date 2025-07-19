// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\index.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    Alert, // Mantido para exibir mensagens diretamente
    Button // Mantido para o botão de admin
} from '@mui/material';

// Importa os componentes de cada passo
import {
    SelectCategoryStep, 
    SelectSubCategoryStep,
    SelectTagsStep,
    ReviewAndCreateStep,
    AdminAddCategoryModal // NOVO: Importa o componente do modal de admin
} from './components'; 

import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext'; // Importa o hook de autenticação

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

    // NOVO: Estado para controlar a exibição do Alert (substituindo Snackbar)
    const [alertInfo, setAlertInfo] = useState({ message: null, severity: null });

    // Obtém o estado de autenticação e o token do contexto, incluindo isAdmin
    const { isAuthenticated, userToken, user } = useAuth(); 
    const isAdmin = user?.isAdmin || false; // Define isAdmin com base no usuário logado

    // Estados para o modal de criação de categoria
    const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false);

    // NOVO: Função para exibir o Alert (substitui showSnackbar)
    const handleShowAlert = useCallback((message, severity) => {
        setAlertInfo({ message, severity });
        // O Alert não fecha automaticamente, então podemos adicionar um timer se quisermos,
        // mas por enquanto, ele permanecerá visível até ser "limpo" ou substituído.
        setTimeout(() => setAlertInfo({ message: null, severity: null }), 6000); // Limpa após 6 segundos
    }, []); // showSnackbar não é mais uma dependência aqui

    // --- Função para buscar categorias do backend ---
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
            
            setCategories(response.data.categories); 
            if (response.data.geminiQuotaExceeded) {
                handleShowAlert('Cota da Gemini API excedida. As categorias sugeridas podem não estar completas.', 'warning');
            }

        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
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
    }, [isAuthenticated, userToken, handleShowAlert]); // handleShowAlert é uma dependência, mas agora é estável

    useEffect(() => {
        if (isAuthenticated && categories.length === 0 && !loadingCategories && !errorCategories) {
            fetchCategories();
        }
    }, [isAuthenticated, categories.length, loadingCategories, errorCategories, fetchCategories]);


    // --- Função para selecionar categoria e avançar ---
    const handleCategorySelectAndAdvance = useCallback((category) => {
        setSelectedCategory(category);
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        handleShowAlert(`Categoria "${category.name}" selecionada. Avançando para Subcategorias.`, 'info');
    }, [handleShowAlert]); // handleShowAlert é uma dependência, mas agora é estável

    // --- Funções para o Modal de Criação de Categoria ---
    const handleOpenAddCategoryModal = () => {
        setOpenAddCategoryModal(true);
    };

    const handleCloseAddCategoryModal = () => {
        setOpenAddCategoryModal(false);
    };

    // NOVO: Callback quando uma categoria é criada no modal do admin
    const handleAdminCategoryCreated = useCallback(async (newCategory) => {
        // Recarrega as categorias para incluir a nova
        await fetchCategories(); 
        // Seleciona a categoria recém-criada e avança
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
                        {/* Botão para Criar Nova Categoria (Admin) - AGORA AQUI, FORA DO SelectCategoryStep */}
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
                Criar Novo Curso (v0.1 - Foco em Categorias)
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

                {/* REMOVIDOS OS BOTÕES DE NAVEGAÇÃO DO STEPPER */}
            </Box>

            {/* Alert para mensagens de feedback */}
            {alertInfo.message && (
                <Alert severity={alertInfo.severity} sx={{ mt: 2, width: '100%' }}>
                    {alertInfo.message}
                </Alert>
            )}

            {/* Modal para Criar Nova Categoria (agora componente separado) */}
            <AdminAddCategoryModal
                open={openAddCategoryModal}
                onClose={handleCloseAddCategoryModal}
                isAuthenticated={isAuthenticated}
                userToken={userToken}
                onCategoryCreated={handleAdminCategoryCreated} // Callback para quando a categoria é criada
                onShowAlert={handleShowAlert} // Passa a função de alert para o modal
            />
        </Container>
    );
}

export default CourseCreatePage;
