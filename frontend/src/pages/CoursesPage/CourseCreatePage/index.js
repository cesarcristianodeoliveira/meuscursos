import React, { useState, useEffect } from 'react';
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
    Chip,
    TextField,
    MenuItem,
    Card,
    CardContent,
    CardActions,
    Paper,
    FormControl,
    InputLabel,
    Select,
    // OutlinedInput, InputAdornment, IconButton não são mais necessários para tags personalizadas via input
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/system';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { Check } from '@mui/icons-material'; // Apenas Check, Close não é estritamente necessário para o chip de seleção

// Estilos para os chips de tags
const StyledChip = styled(Chip)(({ theme, selected }) => ({
    margin: theme.spacing(0.5),
    backgroundColor: selected ? theme.palette.primary.main : theme.palette.grey[300],
    color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
    '&:hover': {
        backgroundColor: selected ? theme.palette.primary.dark : theme.palette.grey[400],
    },
    // Estilo para o ícone de 'check' quando selecionado
    // O deleteIcon no MUI é um slot para um ícone no final do chip.
    // Usamos ele para mostrar o check quando selecionado.
    '& .MuiChip-deleteIcon': {
        color: selected ? theme.palette.primary.contrastText : theme.palette.action.active,
        '&:hover': {
            color: selected ? theme.palette.primary.contrastText : theme.palette.action.hover,
        },
    },
}));

// Definição dos passos do stepper para criação do curso
const steps = ['Detalhes Iniciais', 'Gerar Tags com IA', 'Pré-visualização do Curso', 'Confirmação e Publicação'];

const CourseCreatePage = () => {
    const router = useRouter();
    const theme = useTheme();

    // --- Estados do Stepper e Dados do Curso ---
    const [activeStep, setActiveStep] = useState(0);
    const [courseData, setCourseData] = useState({
        topic: '',
        category: '', // ID da categoria
        subCategory: '', // ID da subcategoria
        level: '',
    });
    const [previewData, setPreviewData] = useState(null); // Dados do curso gerados pela IA para pré-visualização
    const [courseCreatedData, setCourseCreatedData] = useState(null); // Dados do curso salvo no Sanity (para exibição final)

    // --- Estados de Carregamento e Erro ---
    const [isLoading, setIsLoading] = useState(false); // Para geração da preview do curso
    const [isLoadingTags, setIsLoadingTags] = useState(false); // Para geração das tags pela IA
    const [isLoadingSave, setIsLoadingSave] = useState(false); // Para salvar o curso no Sanity
    const [errorMessage, setErrorMessage] = useState(''); // Mensagens de erro para o usuário

    // --- Estados para Seleção de Categorias/Subcategorias/Nível (dados do Sanity) ---
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(''); // Armazena o ID da categoria selecionada
    const [selectedSubCategory, setSelectedSubCategory] = useState(''); // Armazena o ID da subcategoria selecionada
    const [selectedLevel, setSelectedLevel] = useState('');

    // --- Estados para Tags ---
    const [aiSuggestedTags, setAiSuggestedTags] = useState([]); // Array de strings de tags sugeridas pela IA
    const [selectedTags, setSelectedTags] = useState([]); // Array de strings de tags selecionadas pelo usuário

    // --- Efeito para Carregar Categorias e Subcategorias no carregamento da página ---
    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                };

                const [categoriesRes, subCategoriesRes] = await Promise.all([
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/categories`, config),
                    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/subcategories`, config),
                ]);
                setCategories(categoriesRes.data.categories);
                setSubCategories(subCategoriesRes.data.subCategories);
            } catch (error) {
                console.error('Erro ao buscar categorias/subcategorias:', error);
                toast.error('Erro ao carregar dados essenciais para o formulário. Por favor, recarregue a página.');
            }
        };
        fetchCourseData();
    }, []);

    // --- Funções de Navegação do Stepper ---
    const handleNext = () => {
        setErrorMessage(''); // Limpa mensagens de erro ao avançar

        if (activeStep === 0) {
            // Validação do Step 1 (Detalhes Iniciais)
            if (!courseData.topic || !selectedCategory || !selectedSubCategory || !selectedLevel) {
                setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            // Se tudo válido, avançar e iniciar a geração de tags
            handleGenerateAITags();
        } else if (activeStep === 1) {
            // Validação do Step 2 (Seleção de Tags)
            if (selectedTags.length === 0) {
                setErrorMessage('Por favor, selecione pelo menos uma tag para o curso.');
                return;
            }
            // Se tags selecionadas, avançar e iniciar a geração do conteúdo do curso
            handleGenerateCourseContent();
        } else if (activeStep < steps.length - 1) {
            // Avança para o próximo passo se não for o último (o último passo é acionado por handleSaveGeneratedCourse)
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setErrorMessage(''); // Limpa mensagens de erro ao voltar
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        // Reinicia todos os estados para permitir a criação de um novo curso
        setActiveStep(0);
        setCourseData({ topic: '', category: '', subCategory: '', level: '' });
        setSelectedCategory('');
        setSelectedSubCategory('');
        setSelectedLevel('');
        setAiSuggestedTags([]);
        setSelectedTags([]);
        setPreviewData(null);
        setCourseCreatedData(null);
        setIsLoading(false);
        setIsLoadingTags(false);
        setIsLoadingSave(false);
        setErrorMessage('');
    };

    // --- Função para Gerar Tags com IA ---
    const handleGenerateAITags = async () => {
        setIsLoadingTags(true);
        setErrorMessage('');
        setAiSuggestedTags([]); // Limpa tags sugeridas anteriormente
        setSelectedTags([]); // Limpa seleções de tags anteriores

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/generate-tags`,
                {
                    topic: courseData.topic,
                    category: selectedCategory, // Envia o ID da categoria
                    subCategory: selectedSubCategory, // Envia o ID da subcategoria
                    level: selectedLevel,
                },
                config
            );

            if (response.status === 200 && response.data.suggestedTags) {
                setAiSuggestedTags(response.data.suggestedTags);
                // Pré-selecionar todas as tags sugeridas pela IA por padrão para otimizar UX
                setSelectedTags(response.data.suggestedTags);
                setActiveStep((prevActiveStep) => prevActiveStep + 1); // Avança para o passo 2
                toast.success('Tags sugeridas com sucesso!');
            } else {
                setErrorMessage(response.data.error || 'Não foi possível gerar tags. Tente novamente.');
                toast.error(response.data.error || 'Erro ao gerar tags.');
            }
        } catch (error) {
            console.error('Erro ao gerar tags com IA:', error);
            const msg = error.response?.data?.error || 'Erro de conexão ou servidor ao gerar tags.';
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setIsLoadingTags(false);
        }
    };

    // --- Função para Gerar Conteúdo do Curso com IA ---
    const handleGenerateCourseContent = async () => {
        setIsLoading(true);
        setErrorMessage('');
        setPreviewData(null); // Limpa pré-visualização antiga

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/generate-preview`,
                {
                    topic: courseData.topic,
                    category: selectedCategory,
                    subCategory: selectedSubCategory,
                    level: selectedLevel,
                    tags: selectedTags, // Envia os NOMES das tags selecionadas para a IA
                },
                config
            );

            if (response.status === 200 && response.data.coursePreview) {
                setPreviewData(response.data.coursePreview);
                setActiveStep((prevActiveStep) => prevActiveStep + 1); // Avança para o passo 3
                toast.success('Pré-visualização do curso gerada!');
            } else {
                setErrorMessage(response.data.error || 'Não foi possível gerar a pré-visualização do curso. Tente novamente.');
                toast.error(response.data.error || 'Erro ao gerar curso.');
            }
        } catch (error) {
            console.error('Erro ao gerar pré-visualização do curso:', error);
            const msg = error.response?.data?.error || 'Erro de conexão ou servidor ao gerar curso.';
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Função para Salvar o Curso Gerado no Sanity ---
    const handleSaveGeneratedCourse = async () => {
        if (!previewData || isLoadingSave) return; // Impede múltiplos cliques ou salvamento sem dados

        setIsLoadingSave(true);
        setErrorMessage('');

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/save-generated`,
                {
                    courseData: previewData, // Dados do curso completos gerados pela IA
                    category: selectedCategory, // ID da categoria
                    subCategory: selectedSubCategory, // ID da subcategoria
                    level: selectedLevel,
                    tags: selectedTags, // Nomes das tags para o backend processar
                },
                config
            );

            if (response.status === 201) {
                toast.success('Curso criado e salvo com sucesso!');
                console.log('Curso salvo com sucesso:', response.data);
                setCourseCreatedData(response.data.course); // Guarda os dados do curso salvo para exibição no último passo
                setActiveStep((prevActiveStep) => prevActiveStep + 1); // Avança para o passo final de sucesso
            } else {
                setErrorMessage(response.data.error || 'Erro ao salvar o curso.');
                toast.error(response.data.error || 'Erro ao salvar o curso.');
            }
        } catch (error) {
            console.error('Erro ao salvar o curso:', error);
            const msg = error.response?.data?.error || 'Erro de conexão ou servidor ao salvar o curso.';
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setIsLoadingSave(false);
        }
    };

    // --- Função para Gerenciar Seleção/Deseleção de Tags ---
    const handleTagToggle = (tag) => {
        setSelectedTags((prevTags) => {
            if (prevTags.includes(tag)) {
                return prevTags.filter((t) => t !== tag); // Remove a tag se já estiver selecionada
            } else {
                return [...prevTags, tag]; // Adiciona a tag se não estiver selecionada
            }
        });
    };

    // --- Renderização do Conteúdo de Cada Passo do Stepper ---
    const getStepContent = (step) => {
        switch (step) {
            case 0: // Detalhes Iniciais
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                        <TextField
                            label="Tópico do Curso (ex: Programação em React, Finanças Pessoais)"
                            variant="outlined"
                            value={courseData.topic}
                            onChange={(e) => setCourseData({ ...courseData, topic: e.target.value })}
                            fullWidth
                            required
                            helperText="Descreva o tema principal do curso que você deseja criar."
                        />
                        <FormControl fullWidth required>
                            <InputLabel id="category-label">Categoria</InputLabel>
                            <Select
                                labelId="category-label"
                                value={selectedCategory}
                                label="Categoria"
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    // Resetar subcategoria e nível se a categoria mudar para evitar inconsistências
                                    setSelectedSubCategory('');
                                    setSelectedLevel('');
                                }}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selectedCategory && ( // Somente mostra subcategorias se uma categoria for selecionada
                            <FormControl fullWidth required>
                                <InputLabel id="subcategory-label">Subcategoria</InputLabel>
                                <Select
                                    labelId="subcategory-label"
                                    value={selectedSubCategory}
                                    label="Subcategoria"
                                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                                    // Desabilita se não houver subcategorias para a categoria selecionada
                                    disabled={subCategories.filter((sub) => sub.category._ref === selectedCategory).length === 0}
                                >
                                    {subCategories
                                        .filter((sub) => sub.category._ref === selectedCategory) // Filtra subcategorias pela categoria selecionada
                                        .map((sub) => (
                                            <MenuItem key={sub._id} value={sub._id}>
                                                {sub.name}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        )}
                        <FormControl fullWidth required>
                            <InputLabel id="level-label">Nível de Dificuldade</InputLabel>
                            <Select
                                labelId="level-label"
                                value={selectedLevel}
                                label="Nível de Dificuldade"
                                onChange={(e) => setSelectedLevel(e.target.value)}
                            >
                                <MenuItem value="Iniciante">Iniciante</MenuItem>
                                <MenuItem value="Intermediário">Intermediário</MenuItem>
                                <MenuItem value="Avançado">Avançado</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                );
            case 1: // Gerar Tags com IA
                return (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        {isLoadingTags ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <CircularProgress />
                                <Typography variant="h6" color="text.secondary">Gerando sugestões de tags com IA...</Typography>
                                <Typography variant="body2" color="text.secondary">Isso pode levar alguns segundos.</Typography>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h6" gutterBottom>
                                    Tags Sugeridas pela IA
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    As tags abaixo foram sugeridas pela nossa inteligência artificial.
                                    Clique nas tags para adicioná-las ou removê-las do seu curso.
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mb: 3 }}>
                                    {aiSuggestedTags.length > 0 ? (
                                        aiSuggestedTags.map((tag, index) => (
                                            <StyledChip
                                                key={index}
                                                label={tag}
                                                selected={selectedTags.includes(tag)}
                                                onClick={() => handleTagToggle(tag)}
                                                // Exibe um ícone de 'Check' quando a tag está selecionada.
                                                // O onClick no próprio Chip é usado para alternar a seleção.
                                                deleteIcon={selectedTags.includes(tag) ? <Check /> : undefined}
                                                onDelete={selectedTags.includes(tag) ? () => handleTagToggle(tag) : undefined}
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body1" color="text.secondary">
                                            Nenhuma tag sugerida. Por favor, volte e tente gerar novamente.
                                        </Typography>
                                    )}
                                </Box>
                                {/* Não há mais campo para adicionar tags customizadas pelo usuário */}
                            </>
                        )}
                    </Box>
                );
            case 2: // Pré-visualização do Curso
                return (
                    <Box sx={{ mt: 3 }}>
                        {isLoading ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <CircularProgress />
                                <Typography variant="h6" color="text.secondary">A IA está gerando o conteúdo do curso e lições para você.</Typography>
                                <Typography variant="body2" color="text.secondary">Isso pode levar um momento, por favor, aguarde.</Typography>
                            </Box>
                        ) : previewData ? (
                            <Paper elevation={3} sx={{ p: 3, maxHeight: '60vh', overflowY: 'auto' }}> {/* Adicionado scroll para conteúdo longo */}
                                <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.dark }}>
                                    Pré-visualização do Curso: {previewData.title}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    {previewData.description}
                                </Typography>
                                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: theme.palette.info.main }}>
                                    Nível: {previewData.level} | Categoria: {categories.find(c => c._id === selectedCategory)?.name} | Subcategoria: {subCategories.find(s => s._id === selectedSubCategory)?.name}
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                                    Lições do Curso:
                                </Typography>
                                {previewData.lessons.length > 0 ? (
                                    previewData.lessons.map((lesson, index) => (
                                        <Box key={index} sx={{ mb: 2, borderLeft: 4, borderColor: theme.palette.secondary.main, pl: 2, py: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {lesson.order}. {lesson.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }} color="text.secondary">
                                                Tempo estimado de leitura: {lesson.estimatedReadingTime} min
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                {lesson.content.substring(0, 250)}... {/* Mostra uma porção maior do conteúdo */}
                                                {lesson.content.length > 250 && <Typography component="span" sx={{ fontStyle: 'italic', color: 'text.disabled' }}> (Conteúdo completo no curso)</Typography>}
                                            </Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Nenhuma lição gerada. Isso pode indicar um problema com a IA.
                                    </Typography>
                                )}
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontStyle: 'italic' }}>
                                    Tags Associadas: {selectedTags.join(', ')}
                                </Typography>
                            </Paper>
                        ) : (
                            <Alert severity="info">
                                Detalhes do curso e suas lições serão exibidos aqui após a geração.
                            </Alert>
                        )}
                    </Box>
                );
            case 3: // Confirmação e Publicação (Passo de Sucesso)
                return (
                    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {isLoadingSave ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <CircularProgress />
                                <Typography variant="h6" color="text.secondary">Salvando o curso e lições no Sanity CMS...</Typography>
                                <Typography variant="body2" color="text.secondary">Isso pode levar alguns instantes.</Typography>
                            </Box>
                        ) : courseCreatedData ? (
                            <>
                                <Alert severity="success" sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
                                    <AlertTitle>Sucesso!</AlertTitle>
                                    <Typography variant="h5" gutterBottom align="center">
                                        Parabéns! Seu curso foi criado e publicado com sucesso!
                                    </Typography>
                                    <Typography variant="body1" align="center">
                                        Seus créditos foram atualizados e o curso está disponível.
                                    </Typography>
                                </Alert>

                                <Card sx={{ maxWidth: 400, mt: 2, p: 2, boxShadow: 3 }}>
                                    <CardContent>
                                        <Typography gutterBottom variant="h6" component="div">
                                            {courseCreatedData.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {courseCreatedData.description}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'center' }}>
                                        {courseCreatedData.slug?.current && (
                                            <Button
                                                size="large"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => router.push(`/cursos/${courseCreatedData.slug.current}`)}
                                                sx={{ mt: 2 }}
                                            >
                                                Ver Curso
                                            </Button>
                                        )}
                                    </CardActions>
                                </Card>

                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={handleReset}
                                    sx={{ mt: 3 }}
                                >
                                    Criar Outro Curso
                                </Button>
                            </>
                        ) : (
                            <Alert severity="error">
                                <AlertTitle>Erro ao Salvar</AlertTitle>
                                Não foi possível obter os dados do curso salvo. Por favor, tente novamente ou verifique os logs.
                                {errorMessage && <Typography variant="body2">{errorMessage}</Typography>}
                            </Alert>
                        )}
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                Crie um Novo Curso com IA
            </Typography>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Container para o conteúdo do passo, com altura mínima para evitar pulos */}
            <Box sx={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', px: { xs: 1, md: 5 } }}>
                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMessage}
                    </Alert>
                )}
                {getStepContent(activeStep)}
            </Box>

            {/* Botões de Navegação do Stepper */}
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, justifyContent: 'space-between', mt: 4 }}>
                {/* Botão Voltar */}
                <Button
                    color="inherit"
                    disabled={activeStep === 0 || activeStep === steps.length - 1 || isLoading || isLoadingTags || isLoadingSave}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                >
                    Voltar
                </Button>
                <Box sx={{ flex: '1 1 auto' }} /> {/* Espaçador flexível */}

                {/* Botão "Gerar Tags com IA" (Passo 0 -> 1) */}
                {activeStep === 0 && (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        // Desabilita se estiver carregando tags OU se campos obrigatórios não estiverem preenchidos
                        disabled={isLoadingTags || !courseData.topic || !selectedCategory || !selectedSubCategory || !selectedLevel}
                    >
                        {isLoadingTags ? <CircularProgress size={24} color="inherit" /> : 'Gerar Tags com IA'}
                    </Button>
                )}

                {/* Botão "Gerar Pré-visualização do Curso" (Passo 1 -> 2) */}
                {activeStep === 1 && (
                    <Button
                        variant="contained"
                        onClick={handleNext} {/* handleNext chamará handleGenerateCourseContent */}
                        // Desabilita se estiver carregando preview OU se nenhuma tag foi selecionada
                        disabled={isLoading || selectedTags.length === 0}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Gerar Pré-visualização do Curso'}
                    </Button>
                )}

                {/* Botão "Salvar Curso Gerado" (Passo 2 -> 3) */}
                {activeStep === 2 && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveGeneratedCourse}
                        // Desabilita se estiver salvando OU se não houver dados de preview para salvar
                        disabled={isLoadingSave || !previewData}
                    >
                        {isLoadingSave ? <CircularProgress size={24} color="inherit" /> : 'Salvar Curso Gerado'}
                    </Button>
                )}

                {/* Botão "Criar Novo Curso" (Último passo de sucesso) */}
                {activeStep === steps.length - 1 && (
                    <Button
                        variant="contained"
                        onClick={handleReset}
                        color="secondary"
                    >
                        Criar Novo Curso
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default CourseCreatePage;