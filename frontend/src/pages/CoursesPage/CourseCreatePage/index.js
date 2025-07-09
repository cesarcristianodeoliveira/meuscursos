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
    OutlinedInput,
    Chip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../../../contexts/AuthContext';

// Adiciona a variável de ambiente para a URL base da API
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

function CourseCreatePage() {
    const [activeStep, setActiveStep] = useState(0);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('beginner');
    const [selectedTags, setSelectedTags] = useState([]);

    const [fetchedCategories, setFetchedCategories] = useState([]);
    const [fetchedSubCategories, setFetchedSubCategories] = useState([]);
    const [fetchedTags, setFetchedTags] = useState([]);

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
            description: 'Selecione a categoria, subcategoria, nível e tags do curso desejado.'
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
        setLoading(true); // Inicia o loading para as categorias e subcategorias
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
        } finally {
            setLoading(false); // Finaliza o loading
        }
    }, []);

    const fetchTagsByCategory = useCallback(async (categoryId) => {
        setFetchedTags([]);
        setSelectedTags([]);
        if (!categoryId) return;

        setError(null);
        setLoading(true); // Inicia o loading para as tags
        try {
            const tagsResponse = await fetch(`${API_BASE_URL}/api/data/tags/byCategory/${categoryId}`);
            if (!tagsResponse.ok) throw new Error('Falha ao buscar tags por categoria.');
            const tagsData = await tagsResponse.json();
            setFetchedTags(tagsData);
        } catch (err) {
            console.error("Erro ao carregar tags do Sanity:", err);
            setError(`Erro ao carregar tags: ${err.message}.`);
        } finally {
            setLoading(false); // Finaliza o loading
        }
    }, []);

    useEffect(() => {
        fetchSanityData();
    }, [fetchSanityData]);

    useEffect(() => {
        if (selectedCategory) {
            fetchTagsByCategory(selectedCategory);
        } else {
            setFetchedTags([]);
            setSelectedTags([]);
        }
    }, [selectedCategory, fetchTagsByCategory]);

    useEffect(() => {
        const categoryTitle = fetchedCategories.find(cat => cat._id === selectedCategory)?.title;
        const subCategoryTitle = fetchedSubCategories.find(sub => sub._id === selectedSubCategory)?.title;
        const levelLabel = levels.find(lvl => lvl.value === selectedLevel)?.label;
        const tagsNames = fetchedTags.filter(tag => selectedTags.includes(tag._id)).map(tag => tag.name).join(', ');

        let topic = '';
        if (categoryTitle) topic += categoryTitle;
        if (subCategoryTitle) topic += (topic ? ' - ' : '') + subCategoryTitle;
        if (levelLabel) topic += (topic ? ' (' : '') + levelLabel + (topic ? ')' : '');
        if (tagsNames) topic += (topic ? ' com foco em: ' : '') + tagsNames;

        setGeneratedTopic(topic);
    }, [selectedCategory, selectedSubCategory, selectedLevel, selectedTags, fetchedCategories, fetchedSubCategories, fetchedTags, levels]);

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
        setSelectedTags([]);
        setGeneratedTopic('');
        setLoading(false);
        setError(null);
        setSuccessMessage(null);
        setFetchedTags([]);
    };

    const handleGenerateCourse = async () => {
        if (!selectedCategory || !selectedSubCategory || !selectedLevel || !generatedTopic.trim()) {
            setError('Por favor, preencha todos os campos obrigatórios (Categoria, Subcategoria, Nível).');
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
            // --- LINHA CORRIGIDA AQUI ---
            const response = await fetch(`${API_BASE_URL}/api/courses/generate-preview`, {
            // --- FIM DA LINHA CORRIGIDA ---
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
                    tags: selectedTags,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Falha ao gerar o curso no backend.');
            }

            const result = await response.json();
            console.log('Curso gerado com sucesso:', result);
            setSuccessMessage('Pré-visualização do curso gerada com sucesso! Você pode agora salvar o curso.'); // Mensagem atualizada
            setLoading(false);
            handleNext();

        } catch (err) {
            console.error("Erro ao gerar curso:", err);
            if (err.message && err.message.includes('401')) {
                setError('Não autorizado. Sua sessão pode ter expirado. Por favor, faça login novamente.');
            } else if (err.message && err.message.includes('403')) {
                setError('Créditos insuficientes para gerar um curso. Por favor, adicione mais créditos ou entre em contato.');
            } else if (err.message && err.message.includes('Erro da Gemini API')) { // Tratamento específico para erros da Gemini
                setError(`Erro da IA: ${err.message}. Tente novamente.`);
            } else if (err.message && err.message.includes('JSON inválido')) { // Tratamento para erro de parse JSON da IA
                 setError('A resposta da IA está em um formato inesperado. Tente novamente ou ajuste o prompt.');
            }
            else {
                setError(`Erro ao gerar curso: ${err.message}. Verifique o console do backend.`);
            }
            setLoading(false);
        }
    };

    const filteredSubCategories = fetchedSubCategories.filter(
        (subCat) => subCat.categoryRef === selectedCategory
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
                                        <FormControl fullWidth margin="normal" disabled={loading}>
                                            <InputLabel id="category-select-label">Categoria</InputLabel>
                                            <Select
                                                labelId="category-select-label"
                                                id="category-select"
                                                value={selectedCategory}
                                                label="Categoria"
                                                onChange={(e) => {
                                                    setSelectedCategory(e.target.value);
                                                    setSelectedSubCategory('');
                                                    setSelectedTags([]);
                                                }}
                                                disabled={fetchedCategories.length === 0}
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
                                                {filteredSubCategories.map((subCat) => (
                                                    <MenuItem key={subCat._id} value={subCat._id}>
                                                        {subCat.title}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {!loading && selectedCategory && filteredSubCategories.length === 0 && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                                                    Não há subcategorias disponíveis para esta categoria.
                                                </Typography>
                                            )}
                                        </FormControl>

                                        <FormControl
                                            fullWidth
                                            margin="normal"
                                            disabled={!selectedCategory || loading || fetchedTags.length === 0}
                                        >
                                            <InputLabel id="tags-select-label">Tags (Opcional)</InputLabel>
                                            <Select
                                                labelId="tags-select-label"
                                                id="tags-select"
                                                multiple
                                                value={selectedTags}
                                                onChange={(event) => {
                                                    const {
                                                        target: { value },
                                                    } = event;
                                                    setSelectedTags(
                                                        typeof value === 'string' ? value.split(',') : value,
                                                    );
                                                }}
                                                input={<OutlinedInput id="select-multiple-chip" label="Tags (Opcional)" />}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((value) => {
                                                            const tag = fetchedTags.find(t => t._id === value);
                                                            return <Chip key={value} label={tag ? tag.name : value} />;
                                                        })}
                                                    </Box>
                                                )}
                                                MenuProps={MenuProps}
                                            >
                                                {fetchedTags.length === 0 && !selectedCategory ? (
                                                    <MenuItem disabled>Selecione uma categoria primeiro para ver as tags.</MenuItem>
                                                ) : fetchedTags.length === 0 && selectedCategory ? (
                                                    <MenuItem disabled>Não há tags disponíveis para esta categoria.</MenuItem>
                                                ) : (
                                                    fetchedTags.map((tag) => (
                                                        <MenuItem
                                                            key={tag._id}
                                                            value={tag._id}
                                                        >
                                                            {tag.name}
                                                        </MenuItem>
                                                    ))
                                                )}
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth margin="normal" disabled={loading}>
                                            <InputLabel id="level-select-label">Nível</InputLabel>
                                            <Select
                                                labelId="level-select-label"
                                                id="level-select"
                                                value={selectedLevel}
                                                label="Nível"
                                                onChange={(e) => setSelectedLevel(e.target.value)}
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
                                            Tópico Gerado: <br />
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
                    <Button onClick={handleReset} sx={{ mt: 1, mr: 1}}>
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