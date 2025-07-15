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
    Divider,
    Fade,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../../../contexts/AuthContext'; // Confirme o caminho

// Removido: A configuração do Sanity Client foi removida daqui,
// porque o frontend não deve chamar o Sanity diretamente.
// O backend é que se comunica com o Sanity.

// URL base da sua API de backend (do seu .env)
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function CourseCreatePage() {
    const [activeStep, setActiveStep] = useState(0);

    // Estados para os dados do formulário
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('beginner');
    const [selectedTags, setSelectedTags] = useState([]);

    // Estados para os dados carregados do Backend (anteriormente Sanity)
    const [fetchedCategories, setFetchedCategories] = useState([]);
    const [fetchedSubCategories, setFetchedSubCategories] = useState([]);

    // Níveis de curso disponíveis, memoizado para performance
    const levels = useMemo(() => [
        { value: 'beginner', label: 'Iniciante' },
        { value: 'intermediate', label: 'Intermediário' },
        { value: 'advanced', label: 'Avançado' },
    ], []);

    const [generatedTopic, setGeneratedTopic] = useState('');
    const [coursePreview, setCoursePreview] = useState(null);

    // MODIFICAÇÕES PARA TAGS VIA IA
    const [aiSuggestedTags, setAiSuggestedTags] = useState([]);
    const [customTagInput, setCustomTagInput] = useState('');

    // Estados para feedback da UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState({ text: null, courseId: null, courseTitle: null });

    // Obtém o token do usuário e o objeto 'user' do contexto de autenticação
    const { userToken, user } = useAuth();
    const navigate = useNavigate();

    // Definição dos passos do Stepper
    const steps = useMemo(() => [
        {
            label: 'Escolha Detalhes Básicos do Curso',
            description: 'Selecione a categoria, subcategoria e nível do curso desejado.',
        },
        {
            label: 'Gerar e Selecionar Tags',
            description: 'A IA irá sugerir tags baseadas em suas escolhas. Selecione as mais relevantes ou adicione novas. **Mínimo de 1 tag.**',
        },
        {
            label: 'Gerar Conteúdo do Curso',
            description: 'Confirme os detalhes e inicie a geração do conteúdo do curso pela IA. Isso pode levar alguns segundos.',
        },
        {
            label: 'Pré-visualização e Confirmação',
            description: 'Revise a pré-visualização do curso gerada pela IA. Você pode confirmar para salvar ou cancelar.',
        },
        {
            label: 'Concluído',
            description: 'O curso foi gerado e salvo no Sanity CMS!',
        },
    ], []);

    // --- Funções de Busca de Dados do Backend (que por sua vez busca do Sanity) ---
    const fetchInitialDataFromBackend = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            // Requisições para o SEU BACKEND, que então fala com o Sanity
            const categoriesResponse = await fetch(`${API_BASE_URL}/api/data/categories`);
            if (!categoriesResponse.ok) {
                const errorText = await categoriesResponse.text(); // Pega o texto do erro para mais detalhes
                throw new Error(`Falha ao buscar categorias do backend: ${categoriesResponse.status} - ${errorText}`);
            }
            const categoriesData = await categoriesResponse.json();
            setFetchedCategories(categoriesData);

            const subCategoriesResponse = await fetch(`${API_BASE_URL}/api/data/subcategories`);
            if (!subCategoriesResponse.ok) {
                const errorText = await subCategoriesResponse.text();
                throw new Error(`Falha ao buscar subcategorias do backend: ${subCategoriesResponse.status} - ${errorText}`);
            }
            const subCategoriesData = await subCategoriesResponse.json();
            setFetchedSubCategories(subCategoriesData);

        } catch (err) {
            console.error("Erro ao carregar dados iniciais do backend:", err);
            setError(`Erro ao carregar opções: ${err.message}. Verifique se o seu backend está rodando e as rotas estão configuradas.`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Efeito para carregar categorias e subcategorias na montagem do componente
    useEffect(() => {
        fetchInitialDataFromBackend();
    }, [fetchInitialDataFromBackend]);

    // Efeito para gerar o tópico de entrada para a IA baseado nas seleções do usuário
    useEffect(() => {
        const categoryTitle = fetchedCategories.find(cat => cat._id === selectedCategory)?.title;
        const subCategoryTitle = fetchedSubCategories.find(sub => sub._id === selectedSubCategory)?.title;
        const levelLabel = levels.find(lvl => lvl.value === selectedLevel)?.label;

        let topic = '';
        if (categoryTitle) topic += categoryTitle;
        if (subCategoryTitle) topic += (topic ? ' - ' : '') + subCategoryTitle;
        if (levelLabel) topic += (topic ? ' (' : '') + levelLabel + (topic ? ')' : '');

        setGeneratedTopic(topic.trim());
    }, [selectedCategory, selectedSubCategory, selectedLevel, fetchedCategories, fetchedSubCategories, levels]);

    // --- Handlers do Stepper ---

    const handleNext = async () => {
        setError(null);

        // Validação e Ação para cada passo
        switch (activeStep) {
            case 0: // Escolha Detalhes Básicos do Curso
                if (!selectedCategory || !selectedSubCategory || !selectedLevel) {
                    setError('Por favor, selecione a Categoria, Subcategoria e Nível para prosseguir.');
                    return;
                }
                await handleGenerateAITags();
                // Só avança se não houve erro na geração das tags
                if (!error) { // Verifica 'error' após a chamada assíncrona
                    setActiveStep((prevActiveStep) => prevActiveStep + 1);
                }
                break;
            case 1: // Gerar e Selecionar Tags
                if (selectedTags.length === 0) {
                    setError('Por favor, selecione ou adicione ao menos uma tag para prosseguir.');
                    return;
                }
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
                break;
            case 2: // Gerar Conteúdo do Curso
                await handleGenerateCourseContent();
                // Só avança se a pré-visualização foi gerada com sucesso
                if (!error && coursePreview) { // Verifica 'coursePreview' para garantir que a geração foi bem-sucedida
                    setActiveStep((prevActiveStep) => prevActiveStep + 1);
                }
                break;
            case 3: // Pré-visualização e Confirmação
                await handleSaveGeneratedCourse();
                // Só avança se o curso foi salvo com sucesso
                if (!error && successMessage.courseId) {
                    setActiveStep((prevActiveStep) => prevActiveStep + 1);
                }
                break;
            default:
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
                break;
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        setError(null); // Limpa qualquer erro ao voltar

        // Lógica para limpar estados ao voltar (ajustada para os novos passos)
        if (activeStep === 1) { // Voltando de "Gerar e Selecionar Tags" para "Detalhes Básicos"
            setAiSuggestedTags([]);
            setSelectedTags([]);
            setCustomTagInput('');
        } else if (activeStep === 2) { // Voltando de "Gerar Conteúdo" para "Gerar e Selecionar Tags"
            setCoursePreview(null);
            setSuccessMessage({ text: null, courseId: null, courseTitle: null });
        } else if (activeStep === 3) { // Voltando de "Pré-visualização" para "Gerar Conteúdo"
            setCoursePreview(null); // Garante que a pré-visualização seja recarregada ou regenerada se necessário
            setSuccessMessage({ text: null, courseId: null, courseTitle: null });
        }
    };

    const handleReset = () => {
        setActiveStep(0);
        setSelectedCategory('');
        setSelectedSubCategory('');
        setSelectedLevel('beginner');
        setSelectedTags([]);
        setGeneratedTopic('');
        setCoursePreview(null);
        setLoading(false);
        setError(null);
        setSuccessMessage({ text: null, courseId: null, courseTitle: null });
        setAiSuggestedTags([]);
        setCustomTagInput('');
        fetchInitialDataFromBackend(); // Recarrega os dados iniciais do backend
    };

    // --- Lógica de Geração de Tags pela IA (via Backend) ---
    const handleGenerateAITags = async () => {
        setLoading(true);
        setError(null);
        setAiSuggestedTags([]);
        setSelectedTags([]); // Limpa seleções anteriores

        if (!userToken) {
            setError('Você não está autenticado. Por favor, faça login novamente.');
            setLoading(false);
            return;
        }

        if (!generatedTopic.trim()) {
            setError('Não foi possível gerar um tópico claro para a IA. Verifique as seleções de categoria, subcategoria e nível.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/courses/generate-tags`, {
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
                throw new Error(errorData.message || errorData.error || `Falha ao gerar tags. Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Tags sugeridas pela IA (via backend):', result);

            if (result.suggestedTags && Array.isArray(result.suggestedTags) && result.suggestedTags.length > 0) {
                const uniqueNormalizedTags = Array.from(new Set(result.suggestedTags.map(tag => tag.trim().toLowerCase())));
                setAiSuggestedTags(uniqueNormalizedTags);
            } else {
                setError('A IA não conseguiu sugerir tags. Por favor, adicione tags manualmente no campo abaixo.');
            }
        } catch (err) {
            console.error("Erro ao gerar tags da IA (via backend):", err);
            setError(`Erro ao gerar tags: ${err.message}.`);
        } finally {
            setLoading(false);
        }
    };

    // --- Lógica de Geração da Pré-visualização do Curso pela IA (via Backend) ---
    const handleGenerateCourseContent = async () => {
        if (selectedTags.length === 0) {
            setError('Por favor, selecione ou adicione ao menos uma tag para gerar o conteúdo do curso.');
            return;
        }
        if (!generatedTopic.trim()) {
            setError('Não foi possível gerar um tópico claro para a IA. Verifique as seleções de categoria, subcategoria e nível.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage({ text: null, courseId: null, courseTitle: null });
        setCoursePreview(null);

        if (!userToken) {
            setError('Você não está autenticado. Por favor, faça login novamente.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/courses/generate-preview`, {
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
                    tags: selectedTags, // Envia os nomes de tags selecionados/criados pelo usuário
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Falha ao gerar a pré-visualização. Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Resposta completa da pré-visualização (via backend):', result);

            if (result.coursePreview) {
                setCoursePreview(result.coursePreview);
                const previewTitle = result.coursePreview.courseTitle || result.coursePreview.title || 'Curso Gerado';
                setSuccessMessage({ text: 'Pré-visualização do curso gerada com sucesso! Revise e confirme.', courseId: null, courseTitle: previewTitle });
            } else {
                throw new Error('A resposta da IA não contém a pré-visualização esperada (coursePreview).');
            }
        } catch (err) {
            console.error("Erro ao gerar pré-visualização do curso (via backend):", err);
            if (err.message.includes('401')) {
                setError('Não autorizado. Sua sessão pode ter expirado. Por favor, faça login novamente.');
            } else if (err.message.includes('403')) {
                setError('Créditos insuficientes para gerar um curso. Por favor, adicione mais créditos ou entre em contato.');
            } else if (err.message.includes('Erro da Gemini API') || err.message.includes('JSON inválido')) {
                setError(`Erro da IA: ${err.message}. Tente novamente.`);
            } else {
                setError(`Erro ao gerar curso: ${err.message}.`);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Lógica de Salvamento do Curso no Sanity CMS (via Backend) ---
    const handleSaveGeneratedCourse = async () => {
        if (!coursePreview || !(coursePreview.slug || coursePreview.courseTitle || coursePreview.title)) {
            setError('Nenhum curso para salvar. Gere uma pré-visualização primeiro.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage({ text: null, courseId: null, courseTitle: null });

        if (!userToken) {
            setError('Você não está autenticado. Por favor, faça login novamente.');
            setLoading(false);
            return;
        }

        const creatorId = user?._id;
        if (!creatorId) {
            setError('ID do criador não encontrado. Por favor, faça login novamente.');
            setLoading(false);
            return;
        }

        try {
            // Removida a lógica de busca/criação de tags no frontend,
            // isso deve ser responsabilidade do backend.
            // O frontend envia apenas os nomes das tags.

            const response = await fetch(`${API_BASE_URL}/api/courses/save-generated`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                    courseData: {
                        title: coursePreview.courseTitle || coursePreview.title,
                        description: coursePreview.courseDescription || coursePreview.description,
                        lessons: coursePreview.lessons,
                        slug: coursePreview.slug,
                        promptUsed: coursePreview.promptUsed,
                    },
                    category: selectedCategory,
                    subCategory: selectedSubCategory,
                    level: selectedLevel,
                    tags: selectedTags, // Envia os nomes das tags, backend cuidará da referência
                    creatorId: creatorId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Falha ao salvar o curso. Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Curso salvo com sucesso no Sanity (via backend):', result);

            setSuccessMessage({
                text: 'Curso e lições salvos com sucesso no Sanity CMS! 🎉',
                courseId: result._id || result.savedCourseId || result.courseId,
                courseTitle: coursePreview.courseTitle || coursePreview.title
            });

        } catch (err) {
            console.error("Erro ao salvar curso (via backend):", err);
            setError(`Erro ao salvar curso: ${err.message}.`);
        } finally {
            setLoading(false);
        }
    };

    // Filtra as subcategorias com base na categoria selecionada
    const filteredSubCategories = useMemo(() =>
        fetchedSubCategories.filter((subCat) => subCat.categoryRef === selectedCategory),
        [fetchedSubCategories, selectedCategory]
    );

    const handleAddCustomTag = () => {
        const trimmedTag = customTagInput.trim();
        if (trimmedTag !== '') {
            const normalizedTag = trimmedTag.toLowerCase();
            if (!selectedTags.map(t => t.toLowerCase()).includes(normalizedTag)) {
                setSelectedTags(prev => [...prev, trimmedTag]);
                setCustomTagInput('');
                setError(null);
            } else {
                setError(`A tag "${trimmedTag}" já está selecionada.`);
            }
        }
    };

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

            {/* Feedback de erro global */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel optional={index === steps.length - 1 ? <Typography variant="caption">Conclusão</Typography> : null}>
                            {step.label}
                        </StepLabel>
                        <StepContent>
                            <Typography>{step.description}</Typography>
                            <Box sx={{ mb: 2 }}>
                                {/* Passo 0: Escolha Detalhes Básicos do Curso */}
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
                                                    setSelectedSubCategory(''); // Reseta subcategoria
                                                    setSelectedTags([]); // Limpa tags ao mudar categoria
                                                    setAiSuggestedTags([]); // Limpa sugestões de IA
                                                }}
                                                disabled={fetchedCategories.length === 0 || loading}
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
                                            {fetchedCategories.length === 0 && !loading && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                                                    Nenhuma categoria disponível.
                                                </Typography>
                                            )}
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

                                        <FormControl fullWidth margin="normal" disabled={loading}>
                                            <InputLabel id="level-select-label">Nível do Curso</InputLabel>
                                            <Select
                                                labelId="level-select-label"
                                                id="level-select"
                                                value={selectedLevel}
                                                label="Nível do Curso"
                                                onChange={(e) => setSelectedLevel(e.target.value)}
                                            >
                                                {levels.map((level) => (
                                                    <MenuItem key={level.value} value={level.value}>
                                                        {level.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </>
                                )}

                                {/* NOVO PASSO 1: Gerar e Selecionar Tags */}
                                {index === 1 && (
                                    <>
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            Clique nas tags sugeridas pela IA para selecioná-las ou adicione suas próprias tags no campo abaixo.
                                            **Mínimo de 1 tag é necessário.**
                                        </Alert>

                                        {loading && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                                                <CircularProgress size={24} sx={{ mr: 1 }} />
                                                <Typography>Gerando sugestões de tags com IA...</Typography>
                                            </Box>
                                        )}

                                        {/* Exibe tags sugeridas pela IA como Chips */}
                                        {!loading && aiSuggestedTags.length > 0 && (
                                            <Box sx={{ my: 2 }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Tags Sugeridas pela IA:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {aiSuggestedTags.map((tag) => (
                                                        <Chip
                                                            key={tag}
                                                            label={tag}
                                                            clickable
                                                            color={selectedTags.includes(tag) ? 'primary' : 'default'}
                                                            onClick={() => {
                                                                setSelectedTags(prev =>
                                                                    prev.includes(tag)
                                                                        ? prev.filter(t => t !== tag)
                                                                        : [...prev, tag]
                                                                );
                                                            }}
                                                            sx={{ textTransform: 'capitalize' }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                        {!loading && aiSuggestedTags.length === 0 && (
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                                A IA não sugeriu nenhuma tag. Por favor, adicione tags manualmente no campo abaixo.
                                            </Alert>
                                        )}

                                        {/* Exibe tags atualmente selecionadas */}
                                        <Box sx={{ my: 2 }}>
                                            <Typography variant="subtitle1" gutterBottom>
                                                Tags Selecionadas:
                                            </Typography>
                                            <Box sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                                minHeight: '40px',
                                                border: '1px solid lightgrey',
                                                borderRadius: '4px',
                                                p: 1,
                                                alignItems: 'center'
                                            }}>
                                                {selectedTags.length > 0 ? (
                                                    selectedTags.map((tag) => (
                                                        <Chip
                                                            key={tag}
                                                            label={tag}
                                                            onDelete={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ textTransform: 'capitalize' }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Nenhuma tag selecionada ainda.
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Input para tags customizadas */}
                                        <FormControl fullWidth margin="normal" disabled={loading}>
                                            <InputLabel htmlFor="custom-tag-input">Adicionar Nova Tag (digite e Enter)</InputLabel>
                                            <OutlinedInput
                                                id="custom-tag-input"
                                                value={customTagInput}
                                                onChange={(e) => setCustomTagInput(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddCustomTag();
                                                    }
                                                }}
                                                endAdornment={
                                                    <Button
                                                        variant="contained"
                                                        onClick={handleAddCustomTag}
                                                        disabled={customTagInput.trim() === ''}
                                                    >
                                                        Adicionar
                                                    </Button>
                                                }
                                                label="Adicionar Nova Tag (digite e Enter)"
                                            />
                                        </FormControl>
                                    </>
                                )}

                                {/* Passo 2: Gerar Conteúdo do Curso */}
                                {index === 2 && (
                                    <>
                                        <Typography variant="body1" sx={{ mb: 2 }}>
                                            Quase lá! Confirme para que a IA gere a pré-visualização do seu curso.
                                            Isso pode levar um tempo, dependendo da complexidade do tópico e do nível.
                                        </Typography>
                                        {loading && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                                                <CircularProgress size={24} sx={{ mr: 1 }} />
                                                <Typography>Gerando conteúdo do curso com IA...</Typography>
                                            </Box>
                                        )}
                                        {coursePreview && (
                                            <Alert severity="success" sx={{ my: 2 }}>
                                                Pré-visualização gerada! Clique em "Próximo" para revisar.
                                            </Alert>
                                        )}
                                    </>
                                )}

                                {/* Passo 3: Pré-visualização e Confirmação */}
                                {index === 3 && (
                                    <>
                                        {loading && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                                                <CircularProgress size={24} sx={{ mr: 1 }} />
                                                <Typography>Carregando pré-visualização...</Typography>
                                            </Box>
                                        )}
                                        {!loading && coursePreview ? (
                                            <Fade in={true} timeout={500}>
                                                <Paper elevation={3} sx={{ p: 3, mt: 2, border: '1px solid #e0e0e0' }}>
                                                    <Typography variant="h5" gutterBottom color="primary">
                                                        {coursePreview.courseTitle || coursePreview.title}
                                                    </Typography>
                                                    <Typography variant="body1" paragraph>
                                                        {coursePreview.courseDescription || coursePreview.description}
                                                    </Typography>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="h6" gutterBottom>
                                                        Lições Propostas:
                                                    </Typography>
                                                    {coursePreview.lessons && coursePreview.lessons.length > 0 ? (
                                                        coursePreview.lessons.map((lesson, i) => (
                                                            <Box key={i} sx={{ mb: 1.5, pl: 2, borderLeft: '3px solid #1976d2', pb: 1 }}>
                                                                <Typography variant="subtitle1" component="h3">
                                                                    {i + 1}. {lesson.title}
                                                                </Typography>
                                                                {lesson.description && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {lesson.description}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        ))
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Nenhuma lição detalhada gerada para pré-visualização.
                                                        </Typography>
                                                    )}
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="h6" gutterBottom>
                                                        Tags Selecionadas:
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {selectedTags.map((tag) => (
                                                            <Chip key={tag} label={tag} variant="filled" color="primary" size="small" />
                                                        ))}
                                                    </Box>
                                                </Paper>
                                            </Fade>
                                        ) : (
                                            !loading && (
                                                <Alert severity="info" sx={{ my: 2 }}>
                                                    Gere a pré-visualização do curso no passo anterior para visualizá-la aqui.
                                                </Alert>
                                            )
                                        )}
                                    </>
                                )}

                                {/* Passo 4: Concluído */}
                                {index === 4 && (
                                    <Box sx={{ mt: 2 }}>
                                        {successMessage.text && (
                                            <Alert severity="success" sx={{ mb: 2 }}>
                                                {successMessage.text}
                                            </Alert>
                                        )}
                                        {successMessage.courseId && successMessage.courseTitle && (
                                            <Paper elevation={3} sx={{ p: 3, my: 3, textAlign: 'center', border: '1px solid #4caf50' }}>
                                                <Typography variant="h6" gutterBottom>
                                                    Curso Criado:
                                                </Typography>
                                                <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                                                    "{successMessage.courseTitle}"
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => navigate(`/cursos/${successMessage.courseId}`)}
                                                    sx={{ mr: 2 }}
                                                >
                                                    Ver Curso
                                                </Button>
                                                <Button
                                                    onClick={handleReset}
                                                    variant="outlined"
                                                    color="secondary"
                                                >
                                                    Criar Novo Curso
                                                </Button>
                                            </Paper>
                                        )}
                                        {!successMessage.courseId && !loading && (
                                            <Alert severity="error" sx={{ mb: 2 }}>
                                                Ocorreu um erro e o curso não foi salvo ou o ID não foi retornado. Tente novamente.
                                            </Alert>
                                        )}
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                                    <Button
                                        disabled={activeStep === 0 || loading}
                                        onClick={handleBack}
                                        sx={{ mr: 1 }}
                                    >
                                        Voltar
                                    </Button>
                                    {activeStep !== steps.length - 1 ? (
                                        <Button
                                            variant="contained"
                                            onClick={handleNext}
                                            disabled={loading}
                                        >
                                            {loading && (activeStep === 0 || activeStep === 2 || activeStep === 3) ? (
                                                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                                            ) : null}
                                            {activeStep === steps.length - 2 ? 'Salvar e Concluir' : 'Próximo'}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            onClick={handleReset}
                                            disabled={loading}
                                        >
                                            Criar Novo Curso
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
        </Container>
    );
}

export default CourseCreatePage;