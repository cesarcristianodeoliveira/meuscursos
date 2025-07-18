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
    CircularProgress,
    Alert,
    Snackbar,
} from '@mui/material';

import SelectCategoryStep from './components/SelectCategoryStep';
import SelectSubCategoryStep from './components/SelectSubCategoryStep';
import SelectTagsStep from './components/SelectTagsStep';
import ReviewAndCreateStep from './components/ReviewAndCreateStep';

import axios from 'axios';

const steps = ['Selecione a Categoria', 'Passo 2 (Em Breve)', 'Passo 3 (Em Breve)', 'Passo 4 (Em Breve)'];

function CourseCreatePage() {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [errorCategories, setErrorCategories] = useState(null);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

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

    // --- Funções de Fetch ---

    const fetchCategories = useCallback(async () => {
        setLoadingCategories(true);
        setErrorCategories(null);
        try {
            // *** CORREÇÃO AQUI: PORTA E ROTA ATUALIZADAS PARA BATER COM SEU BACKEND ***
            const response = await axios.get('http://localhost:3001/api/courses/create/top-categories', {
                // Se o seu login estiver funcionando, você precisará adicionar o token JWT aqui:
                // headers: {
                //     Authorization: `Bearer ${localStorage.getItem('token')}` // Exemplo: se você guarda o token no localStorage
                // }
            });
            setCategories(response.data);
        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
            // Mensagem de erro mais útil para o usuário
            if (axios.isAxiosError(err) && err.code === 'ERR_NETWORK') {
                setErrorCategories('Erro de rede: O servidor backend pode não estar rodando ou está inacessível. Verifique se o backend está iniciado na porta 3001.');
                showSnackbar('Erro de conexão com o servidor. Tente novamente.', 'error');
            } else if (err.response) {
                // Erro do servidor (e.g., 401 Unauthorized, 500 Internal Server Error)
                setErrorCategories(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Erro desconhecido.'}`);
                showSnackbar(`Erro: ${err.response.data.message || 'Algo deu errado no servidor.'}`, 'error');
            } else {
                // Outros erros
                setErrorCategories('Ocorreu um erro desconhecido ao carregar categorias.');
                showSnackbar('Ocorreu um erro inesperado.', 'error');
            }
        } finally {
            setLoadingCategories(false);
        }
    }, []);

    // --- Efeitos de Carregamento de Dados ---

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // --- Lógica de Navegação do Stepper ---

    const handleNext = () => {
        if (activeStep === 0 && !selectedCategory) {
            showSnackbar('Por favor, selecione uma categoria para continuar.', 'warning');
            return;
        }
        // Se for o Passo 0 e a categoria estiver selecionada, avança para o próximo passo (que estará desativado)
        if (activeStep === 0 && selectedCategory) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            showSnackbar('Funções de Subcategoria, Tags e Criação em desenvolvimento. Fique no Passo 1 por enquanto!', 'info');
            return;
        }
        // Os botões "Próximo" nos passos 1, 2, 3 estão desabilitados na UI, então esta parte
        // teoricamente não será alcançada, mas mantemos a validação defensiva.
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
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Passo 2: Selecione a Subcategoria
                        </Typography>
                        <Alert severity="info">
                            Funcionalidade de Subcategorias em desenvolvimento para esta versão 0.1.
                            Por favor, volte para o Passo 1 ou aguarde as próximas atualizações.
                        </Alert>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Passo 3: Selecione as Tags
                        </Typography>
                        <Alert severity="info">
                            Funcionalidade de Tags em desenvolvimento para esta versão 0.1.
                            Por favor, volte para o Passo 1 ou aguarde as próximas atualizações.
                        </Alert>
                    </Box>
                );
            case 3:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Passo 4: Revisar e Criar
                        </Typography>
                        <Alert severity="info">
                            Funcionalidade de Criação de Curso em desenvolvimento para esta versão 0.1.
                            Por favor, volte para o Passo 1 ou aguarde as próximas atualizações.
                        </Alert>
                    </Box>
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
                        disabled={activeStep === 0 || activeStep > 0} // Desabilita o "Voltar" no primeiro passo e o "Próximo" nos outros para a v0.1
                        onClick={handleBack}
                        variant="outlined"
                    >
                        Voltar
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            color="primary"
                            disabled // Sempre desabilitado na v0.1
                            startIcon={null}
                        >
                            Criar Curso (Em Breve)
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleNext}
                            disabled={activeStep > 0} // Desabilita o "Próximo" após o primeiro passo
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