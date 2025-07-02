// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\index.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Typography,
    Container,
    Box,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Button,
    Paper,
    CircularProgress,
    Alert,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import { Link } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../../../contexts/AuthContext'; 

// Adiciona a variável de ambiente para a URL base da API
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function CourseCreatePage() {
    const [activeStep, setActiveStep] = useState(0);
    
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('beginner');

    const [fetchedCategories, setFetchedCategories] = useState([]);
    const [fetchedSubCategories, setFetchedSubCategories] = useState([]);
    
    const levels = useMemo(() => [
        { value: 'beginner', label: 'Iniciante' },
        { value: 'intermediate', label: 'Intermediário' },
        { value: 'advanced', label: 'Avançado' },
    ], []);

    const [generatedTopic, setGeneratedTopic] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const { userToken } = useAuth();

    const steps = [
        {
            label: 'Escolha os Detalhes do Curso',
            description: 'Selecione a categoria, subcategoria e nível do curso desejado.'
        },
        {
            label: 'Gerar Conteúdo',
            description: 'Confirme os detalhes e inicie a geração do curso pela IA. Isso pode levar alguns segundos.'
        },
        {
            label: 'Concluído',
            description: 'O curso foi gerado e salvo no Sanity CMS!'
        },
    ];

    const fetchSanityData = useCallback(async () => {
        setError(null);
        try {
            const categoriesResponse = await fetch(`${API_BASE_URL}/api/data/categories`);
            if (!categoriesResponse.ok) throw new Error('Falha ao buscar categorias.');
            const categoriesData = await categoriesResponse.json();
            setFetchedCategories(categoriesData);

            const subCategoriesResponse = await fetch(`${API_BASE_URL}/api/data/subcategories`);
            if (!subCategoriesResponse.ok) throw new Error('Falha ao buscar subcategorias.');
            const subCategoriesData = await subCategoriesResponse.json();
            setFetchedSubCategories(subCategoriesData);

        } catch (err) {
            console.error("Erro ao carregar dados do Sanity:", err);
            setError(`Erro ao carregar opções: ${err.message}. Tente recarregar a página.`);
        }
    }, [setError, setFetchedCategories, setFetchedSubCategories]);

    useEffect(() => {
        fetchSanityData();
    }, [fetchSanityData]);

    useEffect(() => {
        const categoryTitle = fetchedCategories.find(cat => cat._id === selectedCategory)?.title;
        const subCategoryTitle = fetchedSubCategories.find(sub => sub._id === selectedSubCategory)?.title;
        const levelLabel = levels.find(lvl => lvl.value === selectedLevel)?.label;

        if (categoryTitle && subCategoryTitle && levelLabel) {
            setGeneratedTopic(`${categoryTitle} - ${subCategoryTitle} (${levelLabel})`);
        } else {
            setGeneratedTopic('');
        }
    }, [selectedCategory, selectedSubCategory, selectedLevel, fetchedCategories, fetchedSubCategories, levels]);

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBackCorrected = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setSelectedCategory('');
        setSelectedSubCategory('');
        setSelectedLevel('beginner');
        setGeneratedTopic('');
        setLoading(false);
        setError(null);
        setSuccessMessage(null);
    };

    const handleGenerateCourse = async () => {
        if (!selectedCategory || !selectedSubCategory || !selectedLevel || !generatedTopic.trim()) {
            setError('Por favor, preencha todos os campos obrigatórios (Categoria, Subcategoria e Nível).');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (!userToken) {
            setError('Você não está autenticado. Por favor, faça login novamente.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/courses/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify({ 
                    topic: generatedTopic, 
                    category: selectedCategory, 
                    subCategory: selectedSubCategory, 
                    level: selectedLevel, 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Falha ao gerar o curso no backend.');
            }

            const result = await response.json();
            console.log('Curso gerado com sucesso:', result);
            setSuccessMessage('Curso e lições gerados e salvos com sucesso no Sanity CMS! 🎉');
            setLoading(false);
            handleNext();

        } catch (err) {
            console.error("Erro ao gerar curso:", err);
            if (err.message && err.message.includes('401')) {
                setError('Não autorizado. Sua sessão pode ter expirado. Por favor, faça login novamente.');
            } else {
                setError(`Erro ao gerar curso: ${err.message}. Verifique o console do backend.`);
            }
            setLoading(false);
        }
    };

    // Filtra as subcategorias com base na categoria selecionada
    const filteredSubCategories = fetchedSubCategories.filter(
        (subCat) => subCat.parentCategory && subCat.parentCategory._ref === selectedCategory
    );

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    to="/cursos"
                    startIcon={<ChevronLeftIcon />}
                    variant="outlined"
                >
                    Voltar para a Lista de Cursos
                </Button>
            </Box>

            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                Crie um Novo Curso com IA
            </Typography>

            <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel optional={index === 2 ? <Typography variant="caption">Conclusão</Typography> : null}>
                            {step.label}
                        </StepLabel>
                        <StepContent>
                            <Typography>{step.description}</Typography>
                            <Box sx={{ mb: 2 }}>
                                {index === 0 && (
                                    <>
                                        <FormControl fullWidth margin="normal">
                                            <InputLabel id="category-select-label">Categoria</InputLabel>
                                            <Select
                                                labelId="category-select-label"
                                                id="category-select"
                                                value={selectedCategory}
                                                label="Categoria"
                                                onChange={(e) => {
                                                    setSelectedCategory(e.target.value);
                                                    setSelectedSubCategory(''); // Limpa a subcategoria ao mudar a categoria
                                                }}
                                                disabled={loading || fetchedCategories.length === 0}
                                            >
                                                <MenuItem value="">
                                                    <em>Nenhum</em>
                                                </MenuItem>
                                                {fetchedCategories.map((cat) => (
                                                    <MenuItem key={cat._id} value={cat._id}>
                                                        {cat.title}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl 
                                            fullWidth 
                                            margin="normal" 
                                            // Desabilita se nenhuma categoria for selecionada, estiver carregando, ou não houver subcategorias para a categoria selecionada
                                            disabled={!selectedCategory || loading || filteredSubCategories.length === 0}
                                        >
                                            <InputLabel id="sub-category-select-label">Subcategoria</InputLabel>
                                            <Select
                                                labelId="sub-category-select-label"
                                                id="sub-category-select"
                                                value={selectedSubCategory}
                                                label="Subcategoria"
                                                onChange={(e) => setSelectedSubCategory(e.target.value)}
                                            >
                                                <MenuItem value="">
                                                    <em>Nenhum</em>
                                                </MenuItem>
                                                {/* Renderiza apenas as subcategorias filtradas */}
                                                {filteredSubCategories.map((subCat) => (
                                                    <MenuItem key={subCat._id} value={subCat._id}>
                                                        {subCat.title}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {/* Mensagem para o usuário se não houver subcategorias */}
                                            {!loading && selectedCategory && filteredSubCategories.length === 0 && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                                                    Não há subcategorias disponíveis para esta categoria.
                                                </Typography>
                                            )}
                                        </FormControl>

                                        <FormControl fullWidth margin="normal">
                                            <InputLabel id="level-select-label">Nível</InputLabel>
                                            <Select
                                                labelId="level-select-label"
                                                id="level-select"
                                                value={selectedLevel}
                                                label="Nível"
                                                onChange={(e) => setSelectedLevel(e.target.value)}
                                                disabled={loading}
                                            >
                                                {levels.map((lvl) => (
                                                    <MenuItem key={lvl.value} value={lvl.value}>
                                                        {lvl.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </>
                                )}
                                {index === 1 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Tópico Gerado: <br/>
                                            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                "{generatedTopic || 'Selecione a categoria, subcategoria e nível.'}"
                                            </Box>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Ao clicar em "Gerar Curso Agora", a inteligência artificial irá criar o curso e suas lições. Este processo pode levar alguns segundos.
                                        </Typography>
                                    </Box>
                                )}

                                <div>
                                    <Button
                                        variant="contained"
                                        onClick={index === 1 ? handleGenerateCourse : handleNext}
                                        sx={{ mt: 1, mr: 1 }}
                                        disabled={
                                            loading ||
                                            (index === 0 && (!selectedCategory || !selectedSubCategory || !selectedLevel)) ||
                                            (index === 1 && loading)
                                        }
                                        startIcon={index === 1 && loading ? <CircularProgress size={20} color="inherit" /> : null}
                                    >
                                        {index === 1 ? (loading ? 'Gerando...' : 'Gerar Curso Agora') : 'Próximo'}
                                    </Button>
                                    <Button
                                        disabled={index === 0 || loading}
                                        onClick={handleBackCorrected}
                                        sx={{ mt: 1, mr: 1 }}
                                    >
                                        Voltar
                                    </Button>
                                </div>
                                {loading && index === 1 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Aguarde, a IA está trabalhando...
                                    </Typography>
                                )}
                                {error && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {error}
                                    </Alert>
                                )}
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>

            {activeStep === steps.length && (
                <Paper square elevation={0} sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
                        {successMessage || 'Processo de criação concluído!'}
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                        Criar Outro Curso
                    </Button>
                    <Button component={Link} to="/cursos" variant="contained" sx={{ mt: 1 }}>
                        Ver Todos os Cursos
                    </Button>
                </Paper>
            )}
        </Container>
    );
}

export default CourseCreatePage;