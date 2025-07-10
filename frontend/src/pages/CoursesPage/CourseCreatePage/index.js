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
import { useAuth } from '../../../contexts/AuthContext'; // Ajuste o caminho se necessário
import ReactMarkdown from 'react-markdown'; // Importar para renderizar Markdown

// URL base da sua API de backend
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Propriedades para o Menu de Tags (MUI Select)
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
    const [activeStep, setActiveStep] = useState(0); // Controla o passo atual do stepper

    // Estados para os dados do formulário
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('beginner'); // Valor padrão 'beginner'
    const [selectedTags, setSelectedTags] = useState([]);

    // Estados para os dados carregados do Sanity/Backend
    const [fetchedCategories, setFetchedCategories] = useState([]);
    const [fetchedSubCategories, setFetchedSubCategories] = useState([]);
    const [fetchedTags, setFetchedTags] = useState([]);

    // Níveis de curso disponíveis, memoizado para performance
    const levels = useMemo(() => [
        { value: 'beginner', label: 'Iniciante' },
        { value: 'intermediate', label: 'Intermediário' },
        { value: 'advanced', label: 'Avançado' },
    ], []);

    const [generatedTopic, setGeneratedTopic] = useState(''); // Tópico gerado para a IA
    const [coursePreview, setCoursePreview] = useState(null); // Armazena o objeto de pré-visualização do curso da resposta da IA

    // Estados para feedback da UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState({ text: null, courseId: null });

    // Obtém o token do usuário e o objeto 'user' do contexto de autenticação
    const { userToken, user } = useAuth();

    // Definição dos passos do Stepper
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
            label: 'Pré-visualização e Confirmação',
            description: 'Revise a pré-visualização do curso gerada pela IA. Você pode confirmar para salvar ou cancelar.'
        },
        {
            label: 'Concluído',
            description: 'O curso foi gerado e salvo no Sanity CMS!'
        },
    ];

    // --- Funções de Busca de Dados ---

    // Busca categorias e subcategorias do backend/Sanity
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

    // Busca tags filtradas por categoria selecionada
    const fetchTagsByCategory = useCallback(async (categoryId) => {
        setFetchedTags([]); // Limpa as tags anteriores
        setSelectedTags([]); // Limpa as tags selecionadas
        if (!categoryId) return; // Não busca se a categoria não estiver selecionada

        setError(null);
        setLoading(true);
        try {
            const tagsResponse = await fetch(`${API_BASE_URL}/api/data/tags/byCategory/${categoryId}`);
            if (!tagsResponse.ok) throw new Error('Falha ao buscar tags por categoria.');
            const tagsData = await tagsResponse.json();
            setFetchedTags(tagsData);
        } catch (err) {
            console.error("Erro ao carregar tags do Sanity:", err);
            setError(`Erro ao carregar tags: ${err.message}.`);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Efeitos Colaterais (useEffect) ---

    // Efeito para carregar categorias e subcategorias no montagem do componente
    useEffect(() => {
        fetchSanityData();
    }, [fetchSanityData]);

    // Efeito para carregar tags quando a categoria selecionada muda
    useEffect(() => {
        if (selectedCategory) {
            fetchTagsByCategory(selectedCategory);
        } else {
            // Limpa as tags se nenhuma categoria estiver selecionada
            setFetchedTags([]);
            setSelectedTags([]);
        }
    }, [selectedCategory, fetchTagsByCategory]);

    // Efeito para gerar o tópico de entrada para a IA baseado nas seleções do usuário
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

    // --- Handlers do Stepper ---

    const handleNext = () => {
        // Validação para o primeiro passo
        if (activeStep === 0) {
            if (!selectedCategory || !selectedSubCategory || !selectedLevel) {
                setError('Por favor, preencha todos os campos obrigatórios (Categoria, Subcategoria, Nível).');
                return;
            }
            setError(null); // Limpa erros se a validação passar
        }
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        // Ao voltar do passo de pré-visualização, limpa a pré-visualização e mensagens de sucesso
        if (activeStep === 2) {
            setCoursePreview(null);
            setSuccessMessage({ text: null, courseId: null });
        }
        setError(null); // Limpa erros ao voltar
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
        setSuccessMessage({ text: null, courseId: null });
        setFetchedTags([]); // Limpa as tags carregadas para forçar recarregamento se a categoria mudar
    };

    // --- Funções Principais de Interação com a API ---

    // Lida com a geração da pré-visualização do curso pela IA
    const handleGenerateCourse = async () => {
        // Validação básica dos campos antes de enviar para o backend
        if (!selectedCategory || !selectedSubCategory || !selectedLevel || !generatedTopic.trim()) {
            setError('Por favor, preencha todos os campos obrigatórios (Categoria, Subcategoria, Nível).');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage({ text: null, courseId: null });
        setCoursePreview(null); // Limpa qualquer pré-visualização anterior

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
                // Melhora o tratamento de erros do backend
                throw new Error(errorData.message || errorData.error || `Falha ao gerar a pré-visualização. Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Resposta completa da pré-visualização:', result);

            // Verifica se a resposta da IA contém o objeto de pré-visualização esperado
            if (result.coursePreview) {
                setCoursePreview(result.coursePreview);
                setSuccessMessage({ text: 'Pré-visualização do curso gerada com sucesso! Revise e confirme.', courseId: null });
                setLoading(false);
                handleNext(); // Avança para o passo de pré-visualização
            } else {
                throw new Error('A resposta da IA não contém a pré-visualização esperada (coursePreview).');
            }
        } catch (err) {
            console.error("Erro ao gerar pré-visualização do curso:", err);
            // Mensagens de erro mais amigáveis para o usuário
            if (err.message.includes('401')) {
                setError('Não autorizado. Sua sessão pode ter expirado. Por favor, faça login novamente.');
            } else if (err.message.includes('403')) {
                setError('Créditos insuficientes para gerar um curso. Por favor, adicione mais créditos ou entre em contato.');
            } else if (err.message.includes('Erro da Gemini API')) {
                setError(`Erro da IA: ${err.message}. Tente novamente.`);
            } else if (err.message.includes('JSON inválido')) {
                setError('A resposta da IA está em um formato inesperado. Tente novamente ou ajuste o prompt.');
            } else {
                setError(`Erro ao gerar curso: ${err.message}.`);
            }
            setLoading(false);
        }
    };

    // Lida com o salvamento do curso gerado pela IA no Sanity CMS
    const handleSaveGeneratedCourse = async () => {
        // Verifica se há uma pré-visualização para salvar
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

        // Obtém o ID do criador do objeto 'user' do AuthContext
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
                    // Envia o objeto courseData conforme esperado pelo seu backend
                    courseData: {
                        title: coursePreview.courseTitle || coursePreview.title,
                        description: coursePreview.courseDescription || coursePreview.description,
                        lessons: coursePreview.lessons,
                        slug: coursePreview.slug,
                        aiGenerationPrompt: coursePreview.promptUsed || '', // <-- ADIÇÃO CHAVE AQUI!
                        aiModelUsed: coursePreview.aiModelUsed || "gemini-2.0-flash", // Garante que o modelo também seja salvo
                    },
                    // Outros metadados são enviados no nível superior
                    category: selectedCategory,
                    subCategory: selectedSubCategory,
                    level: selectedLevel,
                    tags: selectedTags,
                    creatorId: creatorId // Inclui o creatorId obtido do contexto
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
            setLoading(false);
            handleNext();
        } catch (err) {
            console.error("Erro ao salvar curso:", err);
            setError(`Erro ao salvar curso: ${err.message}.`);
            setLoading(false);
        }
    };

    // Filtra as subcategorias com base na categoria selecionada
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

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            {successMessage.text && activeStep !== steps.length - 1 && ( // Exibe sucesso apenas antes do passo final
                <Alert severity="success" sx={{ mb: 3 }}>
                    {successMessage.text}
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
                                                    setSelectedTags([]); // Reseta tags ao mudar categoria
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
                                                        // No autofill of MUI, value is a string with comma-separated values
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
                                            Ao clicar em "Gerar Pré-visualização", a inteligência artificial irá criar uma pré-visualização do curso e suas lições. Este processo pode levar alguns segundos.
                                        </Typography>
                                    </Box>
                                )}
                                {index === 2 && (
                                    <Box sx={{ mt: 2, border: '1px dashed grey', p: 2, borderRadius: '4px' }}>
                                        <Typography variant="h6" gutterBottom>
                                            Pré-visualização do Curso:
                                        </Typography>
                                        {coursePreview ? (
                                            <>
                                                <Typography variant="h5" color="primary.dark" sx={{ mb: 1 }}>
                                                    {coursePreview.courseTitle || coursePreview.title || 'Título não disponível'}
                                                </Typography>
                                                <Typography variant="body1" sx={{ mb: 2 }}>
                                                    **Descrição:** <ReactMarkdown>{coursePreview.courseDescription || coursePreview.description || 'Descrição não disponível'}</ReactMarkdown>
                                                </Typography>

                                                <Divider sx={{ my: 2 }} />

                                                <Typography variant="h6" gutterBottom>
                                                    Estrutura das Lições:
                                                </Typography>
                                                {coursePreview.lessons && coursePreview.lessons.length > 0 ? (
                                                    coursePreview.lessons.map((lesson, lessonIndex) => (
                                                        <Box key={lessonIndex} sx={{ mb: 1.5 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                                Lição {lessonIndex + 1}: {lesson.title}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                <ReactMarkdown>{lesson.content || lesson.description || 'Conteúdo não disponível'}</ReactMarkdown>
                                                            </Typography>
                                                        </Box>
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Nenhuma lição gerada para pré-visualização.
                                                    </Typography>
                                                )}
                                            </>
                                        ) : (
                                            <Typography variant="body1" color="text.secondary">
                                                Nenhum curso para pré-visualizar. Por favor, gere um curso na etapa anterior.
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                                {index === steps.length - 1 && ( // Último passo (Concluído)
                                    <Box sx={{ mt: 2 }}>
                                        {successMessage.text && (
                                            <Alert severity="success" sx={{ mb: 2 }}>
                                                {successMessage.text}
                                            </Alert>
                                        )}
                                        {successMessage.courseId && (
                                            <Button
                                                variant="contained"
                                                component={Link}
                                                to={`/cursos/${successMessage.courseId}`}
                                                sx={{ mt: 1, mr: 1 }}
                                            >
                                                Ver Curso Criado
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleReset}
                                            sx={{ mt: 1, mr: 1 }}
                                            variant="outlined"
                                        >
                                            Criar Novo Curso
                                        </Button>
                                    </Box>
                                )}

                                <div>
                                    {/* Botões para os passos 0 e 1 */}
                                    {index <= 1 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Button
                                                variant="contained"
                                                onClick={index === 1 ? handleGenerateCourse : handleNext}
                                                sx={{ mt: 1, mr: 1 }}
                                                disabled={
                                                    loading ||
                                                    (index === 0 && (!selectedCategory || !selectedSubCategory || !selectedLevel))
                                                }
                                                startIcon={index === 1 && loading ? <CircularProgress size={20} color="inherit" /> : null}
                                            >
                                                {index === 1 ? (loading ? 'Gerando Pré-visualização...' : 'Gerar Pré-visualização') : 'Próximo'}
                                            </Button>
                                            <Button
                                                disabled={index === 0 || loading}
                                                onClick={handleBack}
                                                sx={{ mt: 1, mr: 1 }}
                                            >
                                                Voltar
                                            </Button>
                                        </Box>
                                    )}

                                    {/* Botões para o passo 2 (Pré-visualização e Confirmação) */}
                                    {index === 2 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Button
                                                variant="contained"
                                                onClick={handleSaveGeneratedCourse}
                                                sx={{ mt: 1, mr: 1 }}
                                                disabled={loading || !coursePreview || !coursePreview.slug}
                                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                                            >
                                                {loading ? 'Salvando...' : 'Confirmar e Salvar Curso'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={handleBack} // Volta para o passo de geração se quiser ajustar
                                                sx={{ mt: 1, mr: 1 }}
                                                disabled={loading}
                                            >
                                                Voltar e Editar
                                            </Button>
                                            <Button
                                                variant="text"
                                                onClick={handleReset}
                                                sx={{ mt: 1, mr: 1 }}
                                                disabled={loading}
                                            >
                                                Cancelar e Recomeçar
                                            </Button>
                                        </Box>
                                    )}
                                </div>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
        </Container>
    );
}

export default CourseCreatePage;