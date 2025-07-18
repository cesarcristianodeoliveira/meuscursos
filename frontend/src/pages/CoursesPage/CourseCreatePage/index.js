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
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Ícone de seleção visual
import { useAuth } from '../../../contexts/AuthContext'; // Importa o hook de autenticação
import axios from 'axios'; // Para fazer requisições HTTP ao backend

// Define a URL base do backend a partir do .env
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// --- Componente Principal: CourseCreatePage ---
const CourseCreatePage = () => {
    // Estados para o Stepper
    const [activeStep, setActiveStep] = useState(0);
    const steps = [
        'Selecionar Categoria',
        'Detalhes do Curso', // Próximos passos
        'Conteúdo do Curso',
        'Publicar Curso',
    ];

    // Estados para o Passo 1: Seleção de Categoria
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [errorCategories, setErrorCategories] = useState(null);

    const { isAuthenticated, userToken } = useAuth(); // Obtém o estado de autenticação e o token do contexto

    // Função para buscar categorias do backend
    const fetchCategories = useCallback(async () => {
        if (!isAuthenticated) {
            setErrorCategories("Você precisa estar logado para criar um curso. Redirecionando...");
            // Opcional: Redirecionar para login após um pequeno atraso
            // setTimeout(() => navigate('/login'), 2000);
            return;
        }

        setLoadingCategories(true);
        setErrorCategories(null); // Limpa erros anteriores
        try {
            console.log(`[Frontend] Buscando categorias em: ${API_BASE_URL}/api/courses/create/top-categories`);
            const response = await axios.get(`${API_BASE_URL}/api/courses/create/top-categories`, {
                headers: {
                    Authorization: `Bearer ${userToken}`, // Envia o token de autenticação
                },
            });
            console.log("[Frontend] Categorias recebidas:", response.data.categories);
            if (response.data && Array.isArray(response.data.categories)) {
                setCategories(response.data.categories);
            } else {
                setCategories([]);
                setErrorCategories("Formato de dados de categorias inesperado ou vazio.");
            }
        } catch (error) {
            console.error('[Frontend] Erro ao buscar categorias:', error);
            if (error.response) {
                // Erro de resposta do servidor (e.g., 401, 403, 500)
                setErrorCategories(`Erro do servidor: ${error.response.status} - ${error.response.data.message || 'Ocorreu um erro'}`);
            } else if (error.request) {
                // Requisição feita, mas nenhuma resposta recebida
                setErrorCategories('Nenhuma resposta do servidor. Verifique sua conexão ou se o backend está rodando.');
            } else {
                // Algo aconteceu na configuração da requisição que disparou um erro
                setErrorCategories(`Erro ao configurar a requisição: ${error.message}`);
            }
            setCategories([]); // Limpa as categorias em caso de erro
        } finally {
            setLoadingCategories(false);
        }
    }, [isAuthenticated, userToken]); // Dependências para re-executar a busca

    // Efeito para carregar as categorias quando o componente monta ou o estado de autenticação muda
    useEffect(() => {
        if (isAuthenticated && categories.length === 0 && !loadingCategories && !errorCategories) {
            fetchCategories();
        }
    }, [isAuthenticated, categories.length, loadingCategories, errorCategories, fetchCategories]);


    // Funções de navegação do Stepper
    const handleNext = () => {
        // Validação para o Passo 1
        if (activeStep === 0 && !selectedCategory) {
            setErrorCategories("Por favor, selecione uma categoria para continuar.");
            return;
        }
        setErrorCategories(null); // Limpa o erro se a validação passar
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setErrorCategories(null); // Limpa erros ao voltar
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setSelectedCategory(null);
        setCategories([]);
        setLoadingCategories(false);
        setErrorCategories(null);
    };

    // Conteúdo de cada passo do Stepper
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Passo 1: Selecione a Categoria Principal do Curso
                        </Typography>

                        {/* Exibição de Erros */}
                        {errorCategories && (
                            <Alert severity="error" sx={{ my: 2 }}>
                                {errorCategories}
                                {!loadingCategories && ( // Oferece botão de tentar novamente se não estiver carregando
                                    <Button onClick={fetchCategories} sx={{ mt: 1 }}>Tentar Novamente</Button>
                                )}
                            </Alert>
                        )}

                        {/* Indicador de Carregamento */}
                        {loadingCategories ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', my: 4 }}>
                                <CircularProgress />
                                <Typography sx={{ mt: 2 }}>Buscando categorias...</Typography>
                            </Box>
                        ) : (
                            // Lista de Categorias
                            <List sx={{ width: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                {categories.length > 0 ? (
                                    categories.map((category) => (
                                        <ListItem
                                            key={category._id}
                                            disablePadding
                                            selected={selectedCategory && selectedCategory._id === category._id}
                                            sx={{
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                                '&:last-child': { borderBottom: 'none' },
                                            }}
                                        >
                                            <ListItemButton onClick={() => setSelectedCategory(category)}>
                                                <ListItemText primary={category.title} />
                                                {selectedCategory && selectedCategory._id === category._id && (
                                                    <ListItemIcon sx={{ minWidth: 40, justifyContent: 'flex-end' }}>
                                                        <CheckCircleIcon color="primary" />
                                                    </ListItemIcon>
                                                )}
                                            </ListItemButton>
                                        </ListItem>
                                    ))
                                ) : (
                                    !errorCategories && ( // Mostra mensagem apenas se não houver erro
                                        <Typography sx={{ p: 2, textAlign: 'center' }}>Nenhuma categoria disponível.</Typography>
                                    )
                                )}
                            </List>
                        )}
                    </Box>
                );
            case 1:
                return <Typography sx={{ p: 3 }}>Passo 2: Configurar Detalhes do Curso (Em Breve)</Typography>;
            case 2:
                return <Typography sx={{ p: 3 }}>Passo 3: Adicionar Conteúdo do Curso (Em Breve)</Typography>;
            case 3:
                return <Typography sx={{ p: 3 }}>Passo 4: Revisar e Publicar (Em Breve)</Typography>;
            default:
                return <Typography sx={{ p: 3 }}>Passo desconhecido</Typography>;
        }
    };

    // Determina se o botão "Próximo" deve estar desabilitado
    const isNextButtonDisabled = () => {
        if (loadingCategories) return true; // Desabilitar enquanto carrega
        if (activeStep === 0 && !selectedCategory) return true; // Requer seleção no passo 1
        // Adicionar outras validações para futuros passos aqui
        return false;
    };

    return (
        <Box sx={{ width: '100%', p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
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
                    // Conteúdo quando todos os passos são concluídos
                    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h5" sx={{ mb: 2 }}>
                            Processo de Criação Concluído!
                        </Typography>
                        <Typography>Os detalhes finais do curso serão adicionados aqui.</Typography>
                        <Button onClick={handleReset} sx={{ mt: 2 }} variant="contained">
                            Criar Outro Curso
                        </Button>
                    </Box>
                ) : (
                    // Conteúdo do passo atual e botões de navegação
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
                            <Box sx={{ flex: '1 1 auto' }} /> {/* Espaçador */}
                            <Button
                                onClick={handleNext}
                                variant="contained"
                                disabled={isNextButtonDisabled()}
                            >
                                {activeStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                                {isNextButtonDisabled() && loadingCategories && <CircularProgress size={20} sx={{ ml: 1, color: 'white' }} />} {/* Indicador no botão */}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default CourseCreatePage;