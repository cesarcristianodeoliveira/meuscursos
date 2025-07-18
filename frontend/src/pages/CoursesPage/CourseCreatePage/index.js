// frontend\src\pages\CoursesPage\CourseCreatePage\index.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    CircularProgress,
    Alert,
    AlertTitle,
    // Remover FormControl, RadioGroup, Radio, FormControlLabel - não serão mais usados aqui
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon // Manter para o ícone de 'check' visual
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Ícone de seleção visual
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';

// Define a URL base do backend
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// --- Componente para o Passo 1: Seleção de Categoria ---
const Step1_CategorySelection = ({ selectedCategory, setSelectedCategory, setFetchingCategories, fetchingCategories, categories, setCategories, backendError, setBackendError }) => {
    const { isAuthenticated, userToken } = useAuth();

    const fetchCategories = useCallback(async () => {
        if (!isAuthenticated) {
            console.warn("Usuário não autenticado. Não é possível buscar categorias.");
            setBackendError("Você precisa estar logado para criar um curso.");
            return;
        }

        if (categories.length > 0 && !backendError) {
            console.log("Categorias já carregadas ou sem erro prévio. Pulando nova busca.");
            return;
        }

        setFetchingCategories(true);
        setBackendError(null);
        try {
            console.log("Tentando buscar categorias em:", `${API_BASE_URL}/api/courses/create/top-categories`);
            const response = await axios.get(`${API_BASE_URL}/api/courses/create/top-categories`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });
            console.log("Categorias recebidas:", response.data.categories);

            if (response.data && Array.isArray(response.data.categories)) {
                setCategories(response.data.categories);
            } else {
                setCategories([]);
                setBackendError("Formato de dados de categorias inesperado ou vazio.");
                console.error("Formato de dados de categorias inesperado ou vazio:", response.data);
            }
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            if (error.response) {
                setBackendError(`Erro do servidor: ${error.response.status} - ${error.response.data.message || 'Ocorreu um erro'}`);
            } else if (error.request) {
                setBackendError('Nenhuma resposta do servidor. Verifique sua conexão ou se o backend está rodando.');
            } else {
                setBackendError(`Erro ao configurar a requisição: ${error.message}`);
            }
            setCategories([]);
        } finally {
            setFetchingCategories(false);
        }
    }, [isAuthenticated, userToken, setFetchingCategories, setBackendError, setCategories, categories.length, backendError]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchCategories();
        }
    }, [isAuthenticated, fetchCategories]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Passo 1: Selecione a Categoria do Curso
            </Typography>

            {fetchingCategories ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', my: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Buscando categorias...</Typography>
                </Box>
            ) : backendError ? (
                <Alert severity="error" sx={{ my: 2 }}>
                    <AlertTitle>Erro ao Carregar Categorias</AlertTitle>
                    {backendError}
                    <Button onClick={fetchCategories} sx={{ mt: 1 }}>Tentar Novamente</Button>
                </Alert>
            ) : categories.length === 0 ? (
                <Alert severity="info" sx={{ my: 2 }}>
                    Nenhuma categoria disponível. Verifique o backend ou adicione categorias no Sanity.
                    <Button onClick={fetchCategories} sx={{ mt: 1 }}>Tentar Novamente</Button>
                </Alert>
            ) : (
                <List sx={{ width: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    {categories.map((category) => (
                        <ListItem
                            key={category._id}
                            disablePadding
                            // Prop `selected` do ListItem para controle de estilo
                            selected={selectedCategory && selectedCategory._id === category._id}
                            sx={{
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:last-child': { borderBottom: 'none' },
                            }}
                        >
                            <ListItemButton
                                onClick={() => setSelectedCategory(category)}
                                // Remover a prop `selected` do ListItemButton, pois já está no ListItem
                                // e o estilo de seleção virá do `ListItem`
                            >
                                <ListItemText primary={category.title} />
                                {selectedCategory && selectedCategory._id === category._id && (
                                    <ListItemIcon sx={{ minWidth: 40, justifyContent: 'flex-end' }}>
                                        <CheckCircleIcon color="primary" />
                                    </ListItemIcon>
                                )}
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
};


// --- Componente Principal: CourseCreatePage ---
const CourseCreatePage = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [fetchingCategories, setFetchingCategories] = useState(false);
    const [categories, setCategories] = useState([]);
    const [backendError, setBackendError] = useState(null);

    const steps = [
        'Selecionar Categoria',
        'Selecionar Subcategoria',
        'Selecionar Tags',
        'Selecionar Nível',
        'Gerar Títulos',
        'Selecionar Imagem',
        'Pré-visualizar Curso',
        'Curso Criado',
    ];

    const handleNext = () => {
        if (activeStep === 0 && !selectedCategory) {
            setBackendError("Por favor, selecione uma categoria para continuar.");
            return;
        }
        setBackendError(null);
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setBackendError(null);
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setSelectedCategory(null);
        setCategories([]);
        setBackendError(null);
        setFetchingCategories(false);
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Step1_CategorySelection
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        setFetchingCategories={setFetchingCategories}
                        fetchingCategories={fetchingCategories}
                        categories={categories}
                        setCategories={setCategories}
                        backendError={backendError}
                        setBackendError={setBackendError}
                    />
                );
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6">Passo {step + 1}: {steps[step]}</Typography>
                        <Typography sx={{ mt: 2 }}>Este passo será implementado em breve!</Typography>
                    </Box>
                );
            default:
                return <Typography sx={{ p: 3 }}>Passo desconhecido</Typography>;
        }
    };

    const isNextButtonDisabled = () => {
        if (activeStep === 0) {
            return !selectedCategory;
        }
        return false;
    };

    return (
        <Box sx={{ width: '100%', p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
                Criar Novo Curso
            </Typography>

            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box>
                {activeStep === steps.length ? (
                    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h5" sx={{ mb: 2 }}>
                            Todos os passos concluídos!
                        </Typography>
                        <Typography>O curso foi criado com sucesso! (Detalhes em breve)</Typography>
                        <Button onClick={handleReset} sx={{ mt: 2 }} variant="contained">
                            Criar Outro Curso
                        </Button>
                    </Box>
                ) : (
                    <>
                        {getStepContent(activeStep)}
                        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                            <Button
                                color="inherit"
                                disabled={activeStep === 0}
                                onClick={handleBack}
                                sx={{ mr: 1 }}
                            >
                                Voltar
                            </Button>
                            <Box sx={{ flex: '1 1 auto' }} />
                            <Button
                                onClick={handleNext}
                                variant="contained"
                                disabled={isNextButtonDisabled()}
                            >
                                {activeStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default CourseCreatePage;