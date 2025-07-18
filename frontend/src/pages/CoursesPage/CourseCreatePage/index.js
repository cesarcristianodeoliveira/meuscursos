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

import {
    SelectCategoryStep, 
    SelectSubCategoryStep,
    SelectTagsStep,
    ReviewAndCreateStep
} from './components'; 

import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext'; 

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

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
        // Verifica se o usuário está autenticado antes de fazer a requisição
        if (!isAuthenticated) {
            setErrorCategories("Você precisa estar logado para criar um curso.");
            showSnackbar("Você precisa estar logado para criar um curso.", "warning");
            return;
        }

        setLoadingCategories(true); // Ativa o estado de carregamento
        setErrorCategories(null); // Limpa erros anteriores
        try {
            // URL do backend: http://localhost:3001, rota: /api/courses/create/top-categories
            const response = await axios.get(`${API_BASE_URL}/api/courses/create/top-categories`, {
                headers: {
                    Authorization: `Bearer ${userToken}` // Envia o token de autenticação
                }
            });
            setCategories(response.data); // Atualiza o estado com as categorias recebidas
        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
            // Tratamento de erros mais detalhado para feedback ao usuário
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setErrorCategories('Erro de rede: O servidor backend pode não estar rodando ou está inacessível. Verifique se o backend está iniciado na porta 3001.');
                    showSnackbar('Erro de conexão com o servidor. Tente novamente.', 'error');
                } else if (err.response) {
                    // --- TRATAMENTO PARA ERRO 429 (Cota Excedida) ---
                    if (err.response.status === 429) {
                        setErrorCategories('Cota da Gemini API excedida. Por favor, tente novamente mais tarde ou verifique seu plano.');
                        showSnackbar('Cota da Gemini API excedida. Tente mais tarde.', 'error');
                    } else {
                        // Outros erros de resposta do servidor
                        setErrorCategories(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Erro desconhecido.'}`);
                        showSnackbar(`Erro: ${err.response.data.message || 'Algo deu errado no servidor.'}`, 'error');
                    }
                }
            } else {
                // Outros erros inesperados
                setErrorCategories('Ocorreu um erro desconhecido ao carregar categorias.');
                showSnackbar('Ocorreu um erro inesperado.', 'error');
            }
        } finally {
            setLoadingCategories(false); // Desativa o estado de carregamento
        }
    }, [isAuthenticated, userToken]); // Dependências: re-executa se `isAuthenticated` ou `userToken` mudar

    // Efeito para carregar as categorias quando o componente monta ou o estado de autenticação muda
    useEffect(() => {
        // Só tenta buscar se estiver autenticado e ainda não tiver categorias carregadas
        if (isAuthenticated && categories.length === 0 && !loadingCategories && !errorCategories) {
            fetchCategories();
        }
    }, [isAuthenticated, categories.length, loadingCategories, errorCategories, fetchCategories]);


    // --- Lógica de Navegação do Stepper (Simplificada para a v0.1) ---

    const handleNext = () => {
        // Validação para o Passo 1: Categoria deve ser selecionada
        if (activeStep === 0 && !selectedCategory) {
            showSnackbar('Por favor, selecione uma categoria para continuar.', 'warning');
            return; // Impede o avanço se a categoria não estiver selecionada
        }
        
        // Se a categoria foi selecionada no Passo 0, avança para o próximo passo
        // e exibe uma mensagem informando que os próximos passos estão em desenvolvimento.
        if (activeStep === 0 && selectedCategory) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            showSnackbar('Funções de Subcategoria, Tags e Criação em desenvolvimento. Fique no Passo 1 por enquanto!', 'info');
            return; // Retorna para não executar o resto da função
        }

        // Para a v0.1, os botões "Próximo" nos passos 1, 2, 3 estão desabilitados na UI.
        // Esta parte do código é mais defensiva e não deve ser alcançada se os botões estiverem desabilitados corretamente.
        if (activeStep < steps.length - 1) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    // Renderiza o conteúdo de cada passo do Stepper
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    // AGORA RENDERIZAMOS O COMPONENTE SelectCategoryStep CORRETAMENTE
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
                    // Renderiza o componente esqueleto para o Passo 2
                    <SelectSubCategoryStep />
                );
            case 2:
                return (
                    // Renderiza o componente esqueleto para o Passo 3
                    <SelectTagsStep />
                );
            case 3:
                return (
                    // Renderiza o componente esqueleto para o Passo 4
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
                        // Desabilita o botão "Voltar" no primeiro passo e em todos os outros na v0.1
                        disabled={activeStep === 0 || activeStep > 0} 
                        onClick={handleBack}
                        variant="outlined"
                    >
                        Voltar
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        // Botão "Criar Curso" sempre desabilitado na v0.1
                        <Button
                            variant="contained"
                            color="primary"
                            disabled 
                            startIcon={null}
                        >
                            Criar Curso (Em Breve)
                        </Button>
                    ) : (
                        // Botão "Próximo" ativo apenas para o Passo 0, se a categoria for selecionada
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleNext}
                            disabled={activeStep > 0 || loadingCategories || !selectedCategory} // Desabilita se não for Passo 0, estiver carregando ou categoria não selecionada
                        >
                            Próximo
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Snackbar reintroduzido */}
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default CourseCreatePage;
