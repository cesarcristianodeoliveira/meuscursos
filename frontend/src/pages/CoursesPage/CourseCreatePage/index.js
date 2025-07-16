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

// URL base da sua API de backend (do seu .env)
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// --- LISTA DE PALAVRAS PROIBIDAS PARA TAGS ---
// Você pode expandir esta lista. Idealmente, esta lista também existiria no backend.
const PROHIBITED_TAGS = [
    'sexo', 'drogas', 'pornografia', 'ilegal', 'violencia', 'racismo', 'odio',
    'armas', 'terrorismo', 'nudez', 'proibido', 'adulto', 'conteudo adulto'
];

function CourseCreatePage() {
    const [activeStep, setActiveStep] = useState(0);

    // Estados para os dados do formulário
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('beginner');
    const [selectedTags, setSelectedTags] = useState([]);

    // Estados para os dados carregados do Backend
    const [fetchedCategories, setFetchedCategories] = useState([]);
    const [fetchedSubCategories, setFetchedSubCategories] = useState([]);
    // NOVO: Estado para tags do Sanity
    const [sanityTags, setSanityTags] = useState([]);

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
    // MANUTENÇÃO: customTagInput para uso do admin
    const [customTagInput, setCustomTagInput] = useState('');

    // Estados para feedback da UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState({ text: null, courseId: null, courseTitle: null });

    // Obtém o token do usuário e o objeto 'user' do contexto de autenticação
    const { userToken, user } = useAuth();
    // NOVO: Verifica se o usuário é admin
    const isAdmin = user?.isAdmin || false;
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

    // --- Funções de Busca de Dados do Backend ---

    // NOVO: Função para buscar tags existentes no Sanity
    const fetchSanityTags = useCallback(async () => {
        // Sem loading/error global aqui, pois fetchInitialDataFromBackend já faz isso
        try {
            const response = await fetch(`${API_BASE_URL}/api/data/tags`); // ESTE ENDPOINT É NECESSÁRIO NO BACKEND
            if (!response.ok) {
                const errorText = await response.text();
                // Não setar erro global aqui para não sobrescrever erros de categoria/subcategoria
                console.error(`Falha ao buscar tags do Sanity: ${response.status} - ${errorText}`);
                return; // Apenas sai da função
            }
            const data = await response.json();
            // Mapeie para obter apenas os nomes das tags, normalizando para minúsculas
            const tagNames = data.map(tag => tag.name || tag.title || tag);
            const uniqueNormalizedTags = Array.from(new Set(tagNames.map(tag => tag.trim().toLowerCase())));
            setSanityTags(uniqueNormalizedTags);
        } catch (err) {
            console.error("Erro ao carregar tags do Sanity:", err);
            // Não setar erro global
        }
    }, []);

    const fetchInitialDataFromBackend = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const categoriesResponse = await fetch(`${API_BASE_URL}/api/data/categories`);
            if (!categoriesResponse.ok) {
                const errorText = await categoriesResponse.text();
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

    // Efeito para carregar categorias, subcategorias E tags do Sanity na montagem do componente
    useEffect(() => {
        fetchInitialDataFromBackend();
        fetchSanityTags(); // CHAMA A FUNÇÃO DE BUSCA DE TAGS DO SANITY
    }, [fetchInitialDataFromBackend, fetchSanityTags]);

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

        switch (activeStep) {
            case 0: // Escolha Detalhes Básicos do Curso
                if (!selectedCategory || !selectedSubCategory || !selectedLevel) {
                    setError('Por favor, selecione a Categoria, Subcategoria e Nível para prosseguir.');
                    return;
                }
                await handleGenerateAITags();
                // Verifica se o erro foi setado por handleGenerateAITags
                if (!error) {
                    setActiveStep((prevActiveStep) => prevActiveStep + 1);
                }
                break;
            case 1: // Gerar e Selecionar Tags
                if (selectedTags.length === 0) {
                    setError('Por favor, selecione ou adicione ao menos uma tag para prosseguir.');
                    return;
                }
                // Validação adicional para tags selecionadas (se houver alguma que passou pela IA mas é proibida)
                const containsProhibitedSelected = selectedTags.some(tag =>
                    PROHIBITED_TAGS.some(prohibited => tag.toLowerCase().includes(prohibited))
                );
                if (containsProhibitedSelected) {
                    setError('Uma ou mais tags selecionadas contêm termos proibidos. Por favor, remova-as.');
                    return;
                }
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
                break;
            case 2: // Gerar Conteúdo do Curso
                await handleGenerateCourseContent();
                if (!error && coursePreview) {
                    setActiveStep((prevActiveStep) => prevActiveStep + 1);
                }
                break;
            case 3: // Pré-visualização e Confirmação
                await handleSaveGeneratedCourse();
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
        setError(null);

        if (activeStep === 1) {
            setAiSuggestedTags([]);
            setSelectedTags([]);
            // Reinicia o input manual do admin ao voltar
            setCustomTagInput('');
        } else if (activeStep === 2) {
            setCoursePreview(null);
            setSuccessMessage({ text: null, courseId: null, courseTitle: null });
        } else if (activeStep === 3) {
            setCoursePreview(null);
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
        fetchInitialDataFromBackend();
        fetchSanityTags(); // Reseta também as tags do Sanity
    };

    // --- Lógica de Geração de Tags pela IA (via Backend) ---
    const handleGenerateAITags = async () => {
        setLoading(true);
        setError(null);
        setAiSuggestedTags([]);
        // Não reseta selectedTags aqui, pois o usuário pode ter tags já selecionadas do Sanity.

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
                // Filtra tags sugeridas pela IA para remover as proibidas
                const filteredAiTags = result.suggestedTags.filter(tag =>
                    !PROHIBITED_TAGS.some(prohibited => tag.toLowerCase().includes(prohibited))
                );
                // Normaliza e remove duplicatas
                const uniqueNormalizedAiTags = Array.from(new Set(filteredAiTags.map(tag => tag.trim().toLowerCase())));
                setAiSuggestedTags(uniqueNormalizedAiTags);

                if (filteredAiTags.length === 0 && result.suggestedTags.length > 0) {
                     setError('A IA sugeriu tags, mas todas foram filtradas por conterem termos proibidos. Por favor, selecione tags das opções existentes ou, se for admin, adicione manualmente.');
                }
            } else {
                setError('A IA não conseguiu sugerir tags. Por favor, selecione tags das opções existentes ou, se for admin, adicione manualmente.');
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
        // Validação adicional para tags selecionadas antes de enviar para a geração de conteúdo
        const containsProhibitedSelected = selectedTags.some(tag =>
            PROHIBITED_TAGS.some(prohibited => tag.toLowerCase().includes(prohibited))
        );
        if (containsProhibitedSelected) {
            setError('Uma ou mais tags selecionadas contêm termos proibidos. Por favor, remova-as antes de gerar o conteúdo do curso.');
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
                    tags: selectedTags,
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
        // Validação adicional para tags selecionadas antes de salvar
        const containsProhibitedSelected = selectedTags.some(tag =>
            PROHIBITED_TAGS.some(prohibited => tag.toLowerCase().includes(prohibited))
        );
        if (containsProhibitedSelected) {
            setError('Uma ou mais tags selecionadas contêm termos proibidos. Por favor, remova-as antes de salvar o curso.');
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
                    tags: selectedTags,
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

    // --- FUNÇÃO CORRIGIDA PARA ADICIONAR TAGS CUSTOMIZADAS ---
    // Esta função será usada apenas pelo admin
    const handleAddCustomTag = () => {
        const trimmedTag = customTagInput.trim();
        if (trimmedTag === '') {
            setError('A tag não pode ser vazia.');
            return;
        }

        const normalizedTag = trimmedTag.toLowerCase();

        // Validação: Verificar se a tag contém alguma palavra proibida
        const isProhibited = PROHIBITED_TAGS.some(prohibited =>
            normalizedTag.includes(prohibited) // Verifica se a tag digitada contém a palavra proibida
        );

        if (isProhibited) {
            setError(`A tag "${trimmedTag}" contém termos proibidos. Por favor, escolha outra.`);
            return;
        }

        // Validação: Verificar se a tag já existe nas selecionadas
        if (selectedTags.map(t => t.toLowerCase()).includes(normalizedTag)) {
            setError(`A tag "${trimmedTag}" já está selecionada.`);
            return;
        }

        // Validação: Verificar se a tag já existe nas tags do Sanity (para evitar duplicidade visual)
        if (sanityTags.map(t => t.toLowerCase()).includes(normalizedTag)) {
            setError(`A tag "${trimmedTag}" já existe no Sanity. Selecione-a na lista de tags existentes.`);
            return;
        }

        // Validação: Verificar se a tag já existe nas tags sugeridas pela IA (para evitar duplicidade visual)
        if (aiSuggestedTags.map(t => t.toLowerCase()).includes(normalizedTag)) {
            setError(`A tag "${trimmedTag}" já foi sugerida pela IA. Selecione-a na lista de tags sugeridas.`);
            return;
        }

        // Se passar nas validações, adiciona a tag
        setSelectedTags(prev => [...prev, trimmedTag]);
        setCustomTagInput('');
        setError(null); // Limpa qualquer erro anterior
    };

    // Função para adicionar/remover tag da lista de selecionadas
    const handleToggleTag = (tagToToggle) => {
        const normalizedTagToToggle = tagToToggle.trim().toLowerCase();

        // Verifica se a tag contém alguma palavra proibida antes de adicionar
        const isProhibited = PROHIBITED_TAGS.some(prohibited =>
            normalizedTagToToggle.includes(prohibited)
        );

        if (isProhibited) {
            setError(`A tag "${tagToToggle}" contém termos proibidos e não pode ser selecionada.`);
            return;
        }

        setSelectedTags(prevSelectedTags => {
            const normalizedPrevSelectedTags = prevSelectedTags.map(t => t.toLowerCase());
            if (normalizedPrevSelectedTags.includes(normalizedTagToToggle)) {
                // Remove a tag
                return prevSelectedTags.filter(tag => tag.toLowerCase() !== normalizedTagToToggle);
            } else {
                // Adiciona a tag
                return [...prevSelectedTags, tagToToggle];
            }
        });
        setError(null); // Limpa o erro se uma tag válida for selecionada
    };

    // Filtra as subcategorias com base na categoria selecionada
    const filteredSubCategories = useMemo(() =>
        fetchedSubCategories.filter((subCat) => subCat.categoryRef === selectedCategory),
        [fetchedSubCategories, selectedCategory]
    );

    // --- Get Step Content (Renderiza o conteúdo de cada passo do Stepper) ---
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ mb: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="category-label">Categoria</InputLabel>
                            <Select
                                labelId="category-label"
                                id="category-select"
                                value={selectedCategory}
                                label="Categoria"
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setSelectedSubCategory(''); // Reseta subcategoria ao mudar categoria
                                }}
                                disabled={loading}
                            >
                                <MenuItem value="">
                                    <em>Nenhum</em>
                                </MenuItem>
                                {fetchedCategories.map((category) => (
                                    <MenuItem key={category._id} value={category._id}>
                                        {category.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }} disabled={!selectedCategory}>
                            <InputLabel id="sub-category-label">Subcategoria</InputLabel>
                            <Select
                                labelId="sub-category-label"
                                id="sub-category-select"
                                value={selectedSubCategory}
                                label="Subcategoria"
                                onChange={(e) => setSelectedSubCategory(e.target.value)}
                                disabled={loading || !selectedCategory}
                            >
                                <MenuItem value="">
                                    <em>Nenhum</em>
                                </MenuItem>
                                {filteredSubCategories.map((subCategory) => (
                                    <MenuItem key={subCategory._id} value={subCategory._id}>
                                        {subCategory.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="level-label">Nível</InputLabel>
                            <Select
                                labelId="level-label"
                                id="level-select"
                                value={selectedLevel}
                                label="Nível"
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                disabled={loading}
                            >
                                {levels.map((level) => (
                                    <MenuItem key={level.value} value={level.value}>
                                        {level.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                );
            case 1: // ONDE AS ALTERAÇÕES ESTÃO CONCENTRADAS
                return (
                    <Box sx={{ mb: 2 }}>
                        {loading && (activeStep === 1) ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height={150}>
                                <CircularProgress />
                                <Typography ml={2}>Gerando tags e buscando tags existentes...</Typography>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h6" gutterBottom>Tags Sugeridas pela IA:</Typography>
                                {aiSuggestedTags.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                        {aiSuggestedTags.map((tag) => (
                                            <Chip
                                                key={`ai-${tag}`}
                                                label={tag}
                                                onClick={() => handleToggleTag(tag)}
                                                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                                                variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography color="textSecondary">Nenhuma tag sugerida pela IA. Verifique as seleções do passo anterior ou tente novamente.</Typography>
                                )}

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="h6" gutterBottom>Tags Existentes no Sanity:</Typography>
                                {sanityTags.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                        {sanityTags.map((tag) => (
                                            <Chip
                                                key={`sanity-${tag}`}
                                                label={tag}
                                                onClick={() => handleToggleTag(tag)}
                                                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                                                variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography color="textSecondary">Nenhuma tag existente encontrada no Sanity.</Typography>
                                )}

                                <Divider sx={{ my: 3 }} />

                                {/* NOVO: INPUT DE TAG MANUAL APENAS PARA ADMIN */}
                                {isAdmin && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" gutterBottom>Adicionar Tags Manuais (Apenas Admin):</Typography>
                                        <FormControl fullWidth>
                                            <OutlinedInput
                                                id="custom-tag-input"
                                                placeholder="Adicionar nova tag (ex: JavaScript, Front-end)"
                                                value={customTagInput}
                                                onChange={(e) => setCustomTagInput(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleAddCustomTag();
                                                    }
                                                }}
                                                endAdornment={
                                                    <Button
                                                        onClick={handleAddCustomTag}
                                                        disabled={customTagInput.trim() === ''}
                                                        variant="contained"
                                                        size="small"
                                                    >
                                                        Adicionar
                                                    </Button>
                                                }
                                            />
                                        </FormControl>
                                    </Box>
                                )}
                                {/* FIM DO BLOCO ADMIN */}

                                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Tags Selecionadas para o Curso:</Typography>
                                {selectedTags.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedTags.map((tag) => (
                                            <Chip
                                                key={`selected-${tag}`}
                                                label={tag}
                                                onDelete={() => handleToggleTag(tag)} // Usa toggle para desmarcar
                                                color="primary"
                                                variant="filled"
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography color="textSecondary">Selecione tags sugeridas pela IA ou tags existentes.</Typography>
                                )}
                            </>
                        )}
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Você está prestes a gerar o conteúdo do curso com base em suas seleções.
                            Isso utilizará seus créditos de IA.
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>Tópico de Entrada para IA:</Typography>
                        <Typography variant="body2" sx={{ mb: 2, p: 1, border: '1px dashed grey' }}>
                            {generatedTopic || 'Nenhum tópico gerado. Volte ao passo 1 para selecionar.'}
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>Tags Selecionadas:</Typography>
                        {selectedTags.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {selectedTags.map((tag, index) => (
                                    <Chip key={index} label={tag} color="primary" variant="outlined" size="small" />
                                ))}
                            </Box>
                        ) : (
                            <Typography color="textSecondary">Nenhuma tag selecionada. Volte ao passo 2.</Typography>
                        )}
                    </Box>
                );
            case 3:
                return (
                    <Box sx={{ mb: 2 }}>
                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                                <CircularProgress />
                                <Typography ml={2}>Carregando pré-visualização...</Typography>
                            </Box>
                        ) : coursePreview ? (
                            <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                                <Typography variant="h5" gutterBottom>{coursePreview.courseTitle || coursePreview.title || 'Título do Curso Não Definido'}</Typography>
                                <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                                    {coursePreview.courseDescription || coursePreview.description || 'Descrição não disponível.'}
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>Lições Sugeridas:</Typography>
                                {coursePreview.lessons && coursePreview.lessons.length > 0 ? (
                                    <Box>
                                        {coursePreview.lessons.map((lesson, index) => (
                                            <Box key={index} sx={{ mb: 1.5, pl: 2, borderLeft: '3px solid #1976d2' }}>
                                                <Typography variant="subtitle1">{`${index + 1}. ${lesson.title || 'Lição sem título'}`}</Typography>
                                                {lesson.objectives && lesson.objectives.length > 0 && (
                                                    <Box component="ul" sx={{ mt: 0.5, pl: 2 }}>
                                                        {lesson.objectives.map((obj, objIndex) => (
                                                            <Typography component="li" variant="body2" key={objIndex}>
                                                                {obj}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography color="textSecondary">Nenhuma lição gerada.</Typography>
                                )}
                            </Paper>
                        ) : (
                            !error && <Typography>Nenhuma pré-visualização disponível. Clique em "Próximo" para gerar.</Typography>
                        )}
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    </Box>
                );
            case 4:
                return (
                    <Box sx={{ mb: 2 }}>
                        {successMessage.text ? (
                            <Fade in={true} timeout={1000}>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    <Typography variant="h6">{successMessage.text}</Typography>
                                    {successMessage.courseId && successMessage.courseTitle && (
                                        <Typography variant="body2">
                                            O curso "{successMessage.courseTitle}" (ID: {successMessage.courseId}) foi salvo com sucesso.
                                        </Typography>
                                    )}
                                </Alert>
                            </Fade>
                        ) : (
                            <Alert severity="info">
                                <Typography>O curso foi gerado. Você pode redefinir para criar um novo.</Typography>
                            </Alert>
                        )}
                        <Button
                            variant="contained"
                            onClick={() => navigate('/meus-cursos')} // Ou para a página do curso recém-criado
                            sx={{ mt: 1, mr: 1 }}
                        >
                            Ver Meus Cursos
                        </Button>
                        <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                            Criar Novo Curso
                        </Button>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Button
                component={Link}
                to="/meus-cursos"
                startIcon={<ChevronLeftIcon />}
                sx={{ mb: 3 }}
            >
                Voltar para Meus Cursos
            </Button>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                Criar Novo Curso com IA
            </Typography>

            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 4 }}>
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel
                            optional={
                                index === 2 ? (
                                    <Typography variant="caption">Isso pode levar alguns segundos.</Typography>
                                ) : null
                            }
                        >
                            {step.label}
                        </StepLabel>
                        <StepContent>
                            <Typography>{step.description}</Typography>
                            {getStepContent(index)}
                            <Box sx={{ mb: 2 }}>
                                <div>
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        sx={{ mt: 1, mr: 1 }}
                                        disabled={loading}
                                    >
                                        {activeStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                                    </Button>
                                    <Button
                                        disabled={activeStep === 0 || loading}
                                        onClick={handleBack}
                                        sx={{ mt: 1, mr: 1 }}
                                    >
                                        Voltar
                                    </Button>
                                </div>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
            {activeStep === steps.length && (
                <Paper square elevation={0} sx={{ p: 3, mt: 2 }}>
                    {getStepContent(activeStep)}
                </Paper>
            )}
        </Container>
    );
}

export default CourseCreatePage;