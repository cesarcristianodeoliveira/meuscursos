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
} from '@mui/material';
import { Link } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../../../contexts/AuthContext';

// URL base da sua API de backend
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// --- REMOVIDO: MenuProps e ITEM_HEIGHT/PADDING_TOP não são mais necessários para tags com o novo UI ---

function CourseCreatePage() {
    const [activeStep, setActiveStep] = useState(0);

    // Estados para os dados do formulário
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('beginner');
    const [selectedTags, setSelectedTags] = useState([]); // Agora armazena nomes de tags (strings)

    // Estados para os dados carregados do Sanity/Backend
    const [fetchedCategories, setFetchedCategories] = useState([]);
    const [fetchedSubCategories, setFetchedSubCategories] = useState([]);
    // --- REMOVIDO: fetchedTags não é mais usado para tags pré-definidas ---

    // Níveis de curso disponíveis, memoizado para performance
    const levels = useMemo(() => [
        { value: 'beginner', label: 'Iniciante' },
        { value: 'intermediate', label: 'Intermediário' },
        { value: 'advanced', label: 'Avançado' },
    ], []);

    const [generatedTopic, setGeneratedTopic] = useState('');
    const [coursePreview, setCoursePreview] = useState(null);

    // --- MODIFICAÇÕES PARA TAGS VIA IA ---
    const [aiSuggestedTags, setAiSuggestedTags] = useState([]); // NEW: Tags sugeridas pela IA
    const [customTagInput, setCustomTagInput] = useState(''); // NEW: Para o usuário digitar novas tags

    // Estados para feedback da UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState({ text: null, courseId: null });

    // Obtém o token do usuário e o objeto 'user' do contexto de autenticação
    const { userToken, user } = useAuth();

    // Definição dos passos do Stepper - AGORA COM NOVO PASSO DE TAGS
    const steps = useMemo(() => [ // Usamos useMemo aqui para otimização
        {
            label: 'Escolha Detalhes Básicos do Curso',
            description: 'Selecione a categoria, subcategoria e nível do curso desejado.',
        },
        {
            label: 'Gerar e Selecionar Tags', // NEW STEP
            description: 'A IA irá sugerir tags baseadas em suas escolhas. Selecione as mais relevantes ou adicione novas. **Mínimo de 1 tag.**',
        },
        {
            label: 'Gerar Conteúdo do Curso', // Renamed and reordered
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
    ], []); // Sem dependências para ser criado uma vez

    // --- Funções de Busca de Dados ---

    // Busca categorias e subcategorias do backend/Sanity (SEM MUDANÇAS AQUI)
    const fetchSanityData = useCallback(async () => {
        setError(null);
        setLoading(true);
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
            setLoading(false);
        }
    }, []);

    // --- REMOVIDO: fetchTagsByCategory não é mais necessário, tags serão geradas pela IA ---

    // --- Efeitos Colaterais (useEffect) ---

    // Efeito para carregar categorias e subcategorias no montagem do componente (SEM MUDANÇAS AQUI)
    useEffect(() => {
        fetchSanityData();
    }, [fetchSanityData]);

    // --- REMOVIDO: Efeito para carregar tags quando a categoria selecionada muda ---

    // Efeito para gerar o tópico de entrada para a IA baseado nas seleções do usuário
    // Este tópico será usado tanto para a geração de tags quanto para o conteúdo do curso
    useEffect(() => {
        const categoryTitle = fetchedCategories.find(cat => cat._id === selectedCategory)?.title;
        const subCategoryTitle = fetchedSubCategories.find(sub => sub._id === selectedSubCategory)?.title;
        const levelLabel = levels.find(lvl => lvl.value === selectedLevel)?.label;
        // --- REMOVIDO: A inclusão de tags no tópico aqui, pois elas são geradas em outra etapa ---

        let topic = '';
        if (categoryTitle) topic += categoryTitle;
        if (subCategoryTitle) topic += (topic ? ' - ' : '') + subCategoryTitle;
        if (levelLabel) topic += (topic ? ' (' : '') + levelLabel + (topic ? ')' : '');

        setGeneratedTopic(topic.trim()); // Trim para remover espaços extras
    }, [selectedCategory, selectedSubCategory, selectedLevel, fetchedCategories, fetchedSubCategories, levels]);

    // --- Handlers do Stepper (AGORA COM LÓGICA ATUALIZADA PARA OS NOVOS PASSOS) ---

    const handleNext = async () => {
        setError(null); // Limpa erros anteriores antes de avançar

        // Passo 0: Escolha Detalhes Básicos do Curso
        if (activeStep === 0) {
            if (!selectedCategory || !selectedSubCategory || !selectedLevel) {
                setError('Por favor, selecione a Categoria, Subcategoria e Nível para prosseguir.');
                return; // Impede o avanço
            }
            // Se tudo ok, tenta gerar as tags pela IA
            await handleGenerateAITags();
            // Apenas avança se não houve erro na geração das tags
            if (!error) { // Verifica 'error' novamente após a função async
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }
            return; // Impede a execução do setActiveStep padrão
        }

        // Passo 1: Gerar e Selecionar Tags
        if (activeStep === 1) {
            if (selectedTags.length === 0) {
                setError('Por favor, selecione ou adicione ao menos uma tag para prosseguir.');
                return; // Impede o avanço
            }
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            return;
        }

        // Passo 2: Gerar Conteúdo do Curso
        if (activeStep === 2) {
            // A validação de selectedTags.length === 0 já está em handleGenerateCourseContent
            await handleGenerateCourseContent();
            // Apenas avança se a pré-visualização foi gerada com sucesso
            if (!error && coursePreview) {
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }
            return;
        }

        // Passo 3: Pré-visualização e Confirmação
        if (activeStep === 3) {
            await handleSaveGeneratedCourse();
            // Apenas avança se o curso foi salvo com sucesso
            if (!error && successMessage.courseId) {
                setActiveStep((prevActiveStep) => prevActiveStep + 1);
            }
            return;
        }

        // Para os demais passos (apenas o 'Concluído' agora)
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
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
        } else if (activeStep === 3) { // Voltando de "Pré-visualização" para "Gerar Conteúdo"
            setCoursePreview(null); // Garante que a pré-visualização seja recarregada ou regenerada
            setSuccessMessage({ text: null, courseId: null });
        }
    };

    const handleReset = () => {
        setActiveStep(0);
        setSelectedCategory('');
        setSelectedSubCategory('');
        setSelectedLevel('beginner');
        setSelectedTags([]); // Limpa as tags selecionadas
        setGeneratedTopic('');
        setCoursePreview(null);
        setLoading(false);
        setError(null);
        setSuccessMessage({ text: null, courseId: null });
        setFetchedCategories([]); // Para forçar o recarregamento de categorias e subcategorias
        setFetchedSubCategories([]);
        // --- NEW: Limpa os estados relacionados às tags via IA ---
        setAiSuggestedTags([]);
        setCustomTagInput('');
        // --- FIM NEW ---
        fetchSanityData(); // Recarrega os dados iniciais
    };

    // --- NEW FUNCTION: Lida com a geração de tags pela IA ---
    const handleGenerateAITags = async () => {
        setLoading(true);
        setError(null);
        setAiSuggestedTags([]); // Limpa sugestões anteriores
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
            // Chamada a um NOVO ENDPOINT no backend para gerar tags
            const response = await fetch(`${API_BASE_URL}/api/courses/generate-tags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                    topic: generatedTopic, // O tópico gerado a partir de categoria, subcategoria e nível
                    category: selectedCategory, // Pode ser útil para a IA refinar
                    subCategory: selectedSubCategory, // Pode ser útil para a IA refinar
                    level: selectedLevel, // Pode ser útil para a IA refinar
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Falha ao gerar tags. Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Tags sugeridas pela IA:', result);

            if (result.suggestedTags && Array.isArray(result.suggestedTags) && result.suggestedTags.length > 0) {
                setAiSuggestedTags(result.suggestedTags.map(tag => tag.trim())); // Garante que as tags sejam strings limpas
                // Opcional: pré-selecionar as primeiras tags geradas pela IA
                // setSelectedTags(result.suggestedTags.slice(0, 3).map(tag => tag.trim()));
            } else {
                setError('A IA não conseguiu sugerir tags. Tente ajustar os detalhes do curso ou adicionar manualmente.');
            }
        } catch (err) {
            console.error("Erro ao gerar tags da IA:", err);
            setError(`Erro ao gerar tags: ${err.message}.`);
        } finally {
            setLoading(false);
        }
    };

    // --- RENOMEADO: De handleGenerateCourse para handleGenerateCourseContent ---
    // Lida com a geração da pré-visualização do curso pela IA (AGORA USA AS TAGS SELECIONADAS)
    const handleGenerateCourseContent = async () => {
        // Validação adicional: Verifica se ao menos uma tag foi selecionada/adicionada
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
        setSuccessMessage({ text: null, courseId: null });
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
                    tags: selectedTags, // AGORA ENVIA OS NOMES DE TAGS SELECIONADOS/CRIADOS PELO USUÁRIO
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Falha ao gerar a pré-visualização. Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Resposta completa da pré-visualização:', result);

            if (result.coursePreview) {
                setCoursePreview(result.coursePreview);
                setSuccessMessage({ text: 'Pré-visualização do curso gerada com sucesso! Revise e confirme.', courseId: null });
            } else {
                throw new Error('A resposta da IA não contém a pré-visualização esperada (coursePreview).');
            }
        } catch (err) {
            console.error("Erro ao gerar pré-visualização do curso:", err);
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

    // Lida com o salvamento do curso gerado pela IA no Sanity CMS (AGORA ENVIA OS NOMES DE TAGS)
    const handleSaveGeneratedCourse = async () => {
        if (!coursePreview || !coursePreview.slug) {
            setError('Nenhum curso para salvar. Gere uma pré-visualização primeiro.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage({ text: null, courseId: null });

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
                    tags: selectedTags, // AGORA ENVIA OS NOMES DE TAGS PARA O BACKEND
                    creatorId: creatorId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Falha ao salvar o curso. Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Curso salvo com sucesso no Sanity:', result);

            setSuccessMessage({
                text: 'Curso e lições salvos com sucesso no Sanity CMS! 🎉',
                courseId: result._id || result.savedCourseId || result.courseId
            });
        } catch (err) {
            console.error("Erro ao salvar curso:", err);
            setError(`Erro ao salvar curso: ${err.message}.`);
        } finally {
            setLoading(false);
        }
    };

    // Filtra as subcategorias com base na categoria selecionada (SEM MUDANÇAS AQUI)
    const filteredSubCategories = useMemo(() =>
        fetchedSubCategories.filter((subCat) => subCat.categoryRef === selectedCategory),
        [fetchedSubCategories, selectedCategory]
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
                                                    setSelectedSubCategory(''); // Reseta subcategoria ao mudar categoria
                                                    // --- REMOVIDO: Reseta tags aqui, pois agora estão em outro passo ---
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
                                            Clique nas tags sugeridas para selecioná-las ou adicione suas próprias tags no campo abaixo.
                                        </Alert>

                                        {loading && <CircularProgress size={24} sx={{ mr: 2 }} />}

                                        {/* Exibe tags sugeridas pela IA como Chips */}
                                        {!loading && aiSuggestedTags.length > 0 && (
                                            <Box sx={{ my: 2 }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Tags Sugeridas pela IA:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {aiSuggestedTags.map((tag, i) => (
                                                        <Chip
                                                            key={tag} // Usar a tag como key, já que serão strings únicas
                                                            label={tag}
                                                            clickable
                                                            color={selectedTags.includes(tag) ? 'primary' : 'default'}
                                                            onClick={() => {
                                                                setSelectedTags(prev =>
                                                                    prev.includes(tag)
                                                                        ? prev.filter(t => t !== tag) // Desseleciona se já estiver incluída
                                                                        : [...prev, tag] // Adiciona se não estiver
                                                                );
                                                            }}
                                                            sx={{
                                                                textTransform: 'capitalize' // Para primeira letra maiúscula
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                        {!loading && aiSuggestedTags.length === 0 && (
                                             <Alert severity="warning" sx={{ mb: 2 }}>
                                                 A IA não sugeriu nenhuma tag. Por favor, adicione tags manualmente.
                                             </Alert>
                                        )}


                                        {/* Exibe tags atualmente selecionadas */}
                                        <Box sx={{ my: 2 }}>
                                            <Typography variant="subtitle1" gutterBottom>
                                                Tags Selecionadas:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '40px', border: '1px solid lightgrey', borderRadius: '4px', p: 1 }}>
                                                {selectedTags.length > 0 ? (
                                                    selectedTags.map((tag, i) => (
                                                        <Chip
                                                            key={tag}
                                                            label={tag}
                                                            onDelete={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{
                                                                textTransform: 'capitalize'
                                                            }}
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
                                        <FormControl fullWidth margin="normal">
                                            <InputLabel htmlFor="custom-tag-input">Adicionar Nova Tag (digite e Enter)</InputLabel>
                                            <OutlinedInput
                                                id="custom-tag-input"
                                                value={customTagInput}
                                                onChange={(e) => setCustomTagInput(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && customTagInput.trim() !== '') {
                                                        const newTag = customTagInput.trim().toLowerCase(); // Normalize para minúsculas
                                                        // Validação para evitar tags duplicadas
                                                        if (!selectedTags.map(t => t.toLowerCase()).includes(newTag)) {
                                                            setSelectedTags(prev => [...prev, newTag]);
                                                        } else {
                                                            setError(`A tag "${newTag}" já está selecionada.`);
                                                        }
                                                        setCustomTagInput('');
                                                        e.preventDefault();
                                                    }
                                                }}
                                                label="Adicionar Nova Tag (digite e Enter)"
                                                endAdornment={
                                                    <Button
                                                        onClick={() => {
                                                            if (customTagInput.trim() !== '') {
                                                                const newTag = customTagInput.trim().toLowerCase();
                                                                if (!selectedTags.map(t => t.toLowerCase()).includes(newTag)) {
                                                                    setSelectedTags(prev => [...prev, newTag]);
                                                                } else {
                                                                    setError(`A tag "${newTag}" já está selecionada.`);
                                                                }
                                                                setCustomTagInput('');
                                                            }
                                                        }}
                                                        disabled={customTagInput.trim() === ''}
                                                    >
                                                        Adicionar
                                                    </Button>
                                                }
                                            />
                                            {selectedTags.length === 0 && (
                                                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1 }}>
                                                    Selecione ou adicione ao menos uma tag para prosseguir.
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </>
                                )}

                                {/* Passo 2: Gerar Conteúdo do Curso (antes era passo 1) */}
                                {index === 2 && (
                                    <Box sx={{ my: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Tópico de Geração da IA:
                                        </Typography>
                                        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{generatedTopic || 'Nenhum tópico gerado ainda.'}</Typography>
                                        </Paper>
                                        {selectedTags.length > 0 && (
                                            <Box sx={{ my: 2 }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Tags Finais para Geração:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {selectedTags.map((tag, i) => (
                                                        <Chip key={tag} label={tag} color="primary" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                        {loading && <CircularProgress size={24} sx={{ mr: 2 }} />}
                                        {!loading && !coursePreview && (
                                            <Button
                                                variant="contained"
                                                onClick={handleGenerateCourseContent}
                                                disabled={loading || !generatedTopic.trim() || selectedTags.length === 0}
                                            >
                                                Gerar Conteúdo do Curso
                                            </Button>
                                        )}
                                        {coursePreview && (
                                            <Alert severity="success">
                                                Conteúdo do curso gerado com sucesso! Clique em "Próximo" para revisar.
                                            </Alert>
                                        )}
                                    </Box>
                                )}

                                {/* Passo 3: Pré-visualização e Confirmação (antes era passo 2) */}
                                {index === 3 && (
                                    <Box sx={{ my: 2 }}>
                                        {coursePreview ? (
                                            <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
                                                <Typography variant="h5" component="h2" gutterBottom>
                                                    {coursePreview.courseTitle || coursePreview.title || 'Título do Curso'}
                                                </Typography>
                                                <Typography variant="body1" paragraph>
                                                    {coursePreview.courseDescription || coursePreview.description || 'Descrição do curso não disponível.'}
                                                </Typography>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="h6" gutterBottom>
                                                    Lições:
                                                </Typography>
                                                {coursePreview.lessons && coursePreview.lessons.length > 0 ? (
                                                    coursePreview.lessons.map((lesson, i) => (
                                                        <Box key={i} sx={{ mb: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                                {i + 1}. {lesson.title}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ ml: 2 }}>
                                                                {lesson.description}
                                                            </Typography>
                                                        </Box>
                                                    ))
                                                ) : (
                                                    <Typography variant="body2">Nenhuma lição gerada.</Typography>
                                                )}
                                                {/* Exibe tags selecionadas na pré-visualização */}
                                                {selectedTags.length > 0 && (
                                                    <Box sx={{ mt: 3 }}>
                                                        <Typography variant="subtitle1" gutterBottom>
                                                            Tags Associadas:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {selectedTags.map((tag, i) => (
                                                                <Chip key={tag} label={tag} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Paper>
                                        ) : (
                                            <Alert severity="warning">Nenhuma pré-visualização de curso disponível. Volte para a etapa anterior para gerar.</Alert>
                                        )}

                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={handleSaveGeneratedCourse}
                                            disabled={loading || !coursePreview}
                                            sx={{ mr: 1 }}
                                        >
                                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar e Salvar Curso'}
                                        </Button>
                                    </Box>
                                )}

                                {/* Passo 4: Concluído (antes era passo 3) */}
                                {index === 4 && (
                                    <Box sx={{ my: 2 }}>
                                        {successMessage.text && (
                                            <Alert severity="success" sx={{ mb: 2 }}>
                                                {successMessage.text}
                                                {successMessage.courseId && (
                                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                                        ID do Curso Salvo: {successMessage.courseId}
                                                    </Typography>
                                                )}
                                            </Alert>
                                        )}
                                        <Button
                                            variant="contained"
                                            onClick={handleReset}
                                            sx={{ mr: 1 }}
                                        >
                                            Criar Novo Curso
                                        </Button>
                                        {successMessage.courseId && (
                                            <Button
                                                component={Link}
                                                to={`/cursos/${coursePreview.slug}`}
                                                variant="outlined"
                                            >
                                                Ver Curso
                                            </Button>
                                        )}
                                    </Box>
                                )}

                                {/* Navegação entre os passos */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    {/* Botão Voltar: Não exibe no primeiro passo e nem no último */}
                                    {activeStep !== 0 && activeStep !== steps.length - 1 && (
                                        <Button
                                            disabled={loading}
                                            onClick={handleBack}
                                            sx={{ mr: 1 }}
                                        >
                                            Voltar
                                        </Button>
                                    )}
                                    {/* Botão Próximo: Não exibe no último passo */}
                                    {activeStep < steps.length - 1 && (
                                        <Button
                                            variant="contained"
                                            onClick={handleNext}
                                            disabled={loading} // A validação individual dos passos está dentro de handleNext agora
                                        >
                                            {activeStep === steps.length - 2 ? 'Confirmar e Salvar' : 'Próximo'}
                                        </Button>
                                    )}
                                </Box>

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
        </Container>
    );
}

export default CourseCreatePage;