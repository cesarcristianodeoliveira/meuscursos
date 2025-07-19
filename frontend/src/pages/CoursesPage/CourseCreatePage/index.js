// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\index.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Alert,
    Snackbar,
} from '@mui/material';

// Importa os componentes de cada passo
import {
    SelectCategoryStep, 
    SelectSubCategoryStep,
    SelectTagsStep,
    ReviewAndCreateStep
} from './components'; 

import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext'; // Importa o hook de autenticação

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Define os passos do Stepper. Para a v0.1, os outros passos são "Em Breve".
const steps = ['Selecione a Categoria', 'Passo 2 (Em Breve)', 'Passo 3 (Em Breve)', 'Passo 4 (Em Breve)'];

function CourseCreatePage() {
    // Estados para o Stepper e o Passo 1 (Categorias)
    const [activeStep, setActiveStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [errorCategories, setErrorCategories] = useState(null);

    // Estados para o Snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Obtém o estado de autenticação e o token do contexto
    const { isAuthenticated, userToken } = useAuth(); 

    // Funções para gerenciar o Snackbar
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // --- Função para buscar categorias do backend ---
    const fetchCategories = useCallback(async () => {
        if (!isAuthenticated) {
            setErrorCategories("Você precisa estar logado para criar um curso.");
            showSnackbar("Você precisa estar logado para criar um curso.", "warning");
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
            
            // NOVO: A resposta agora é um objeto com 'categories' e 'geminiQuotaExceeded'
            setCategories(response.data.categories); 
            if (response.data.geminiQuotaExceeded) {
                showSnackbar('Cota da Gemini API excedida. As categorias sugeridas podem não estar completas.', 'warning');
            }

        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setErrorCategories('Erro de rede: O servidor backend pode não estar rodando ou está inacessível. Verifique se o backend está iniciado na porta 3001.');
                    showSnackbar('Erro de conexão com o servidor. Tente novamente.', 'error');
                } else if (err.response) {
                    // Se o backend retornou um erro (ex: 401 Unauthorized, 500 Internal Server Error)
                    setErrorCategories(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Erro desconhecido.'}`);
                    showSnackbar(`Erro: ${err.response.data.message || 'Algo deu errado no servidor.'}`, 'error');
                }
            } else {
                setErrorCategories('Ocorreu um erro desconhecido ao carregar categorias.');
                showSnackbar('Ocorreu um erro inesperado.', 'error');
            }
        } finally {
            setLoadingCategories(false);
        }
    }, [isAuthenticated, userToken]);

    useEffect(() => {
        if (isAuthenticated && categories.length === 0 && !loadingCategories && !errorCategories) {
            fetchCategories();
        }
    }, [isAuthenticated, categories.length, loadingCategories, errorCategories, fetchCategories]);


    const handleNext = () => {
        if (activeStep === 0 && !selectedCategory) {
            showSnackbar('Por favor, selecione uma categoria para continuar.', 'warning');
            return;
        }
        if (activeStep === 0 && selectedCategory) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            showSnackbar('Funções de Subcategoria, Tags e Criação em desenvolvimento. Fique no Passo 1 por enquanto!', 'info');
            return;
        }
        if (activeStep < steps.length - 1) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <SelectCategoryStep
                        categories={categories}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        loading={loadingCategories}
                        error={errorCategories}
                    />
                );
            case 1:
                return (
                    <SelectSubCategoryStep />
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        disabled={activeStep === 0 || activeStep > 0} 
                        onClick={handleBack}
                        variant="outlined"
                    >
                        Voltar
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            color="primary"
                            disabled 
                            startIcon={null}
                        >
                            Criar Curso (Em Breve)
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleNext}
                            disabled={activeStep > 0 || loadingCategories || !selectedCategory} 
                        >
                            Próximo
                        </Button>
                    )}
                </Box>
            </Box>

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default CourseCreatePage;
