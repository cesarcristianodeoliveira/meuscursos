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
    OutlinedInput,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/system';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { Check, Close } from '@mui/icons-material'; // Importar ícones para os Chips

// Estilos para os chips de tags
const StyledChip = styled(Chip)(({ theme, selected }) => ({
    margin: theme.spacing(0.5),
    backgroundColor: selected ? theme.palette.primary.main : theme.palette.grey[300],
    color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
    '&:hover': {
        backgroundColor: selected ? theme.palette.primary.dark : theme.palette.grey[400],
    },
}));

const steps = ['Detalhes Iniciais', 'Gerar Tags com IA', 'Pré-visualização do Curso', 'Confirmação e Publicação'];

const CourseCreatePage = () => {
    const router = useRouter();
    const theme = useTheme();

    // --- Estados do Stepper e Dados do Curso ---
    const [activeStep, setActiveStep] = useState(0);
    const [courseData, setCourseData] = useState({
        topic: '',
        category: '',
        subCategory: '',
        level: '',
    });
    const [previewData, setPreviewData] = useState(null); // Dados do curso gerados pela IA
    const [courseCreatedData, setCourseCreatedData] = useState(null); // Dados do curso salvo no Sanity

    // --- Estados de Carregamento e Erro ---
    const [isLoading, setIsLoading] = useState(false); // Para geração da preview
    const [isLoadingTags, setIsLoadingTags] = useState(false); // Para geração das tags
    const [isLoadingSave, setIsLoadingSave] = useState(false); // Para salvar o curso
    const [errorMessage, setErrorMessage] = useState('');

    // --- Estados para Seleção de Categorias/Subcategorias/Nível ---
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');

    // --- Estados para Tags ---
    const [aiSuggestedTags, setAiSuggestedTags] = useState([]); // Tags sugeridas pela IA
    const [selectedTags, setSelectedTags] = useState([]); // Tags selecionadas (incluindo as personalizadas)
    // REMOVIDO: customTagInput e handleAddCustomTag, pois não queremos que o usuário adicione tags customizadas via input.

    // --- Efeito para Carregar Categorias e Subcategorias ---
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
                toast.error('Erro ao carregar dados essenciais para o formulário.');
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
            // Se tudo válido, avançar e gerar tags
            handleGenerateAITags();
        } else if (activeStep === 1) {
            // Validação do Step 2 (Gerar Tags com IA)
            if (selectedTags.length === 0) {
                setErrorMessage('Por favor, selecione ou gere pelo menos uma tag.');
                return;
            }
            handleGenerateCourseContent();
        } else {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setErrorMessage(''); // Limpa mensagens de erro ao voltar
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setCourseData({ topic: '', category: '', subCategory: '', level: '' });
        setSelectedCategory('');
        setSelectedSubCategory('');
        setAiSuggestedTags([]);
        setSelectedTags([]);
        setPreviewData(null);
        setCourseCreatedData(null);
        setIsLoading(false);
        setIsLoadingTags(false);
        setIsLoadingSave(false);
        setErrorMessage('');
    };

    // --- Função para Gerar Tags com IA (NOVO) ---
    const handleGenerateAITags = async () => {
        setIsLoadingTags(true);
        setErrorMessage('');
        setAiSuggestedTags([]); // Limpa tags antigas
        setSelectedTags([]); // Limpa seleções antigas

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
                // Pré-selecionar todas as tags sugeridas pela IA por padrão
                setSelectedTags(response.data.suggestedTags);
                setActiveStep((prevActiveStep) => prevActiveStep + 1); // Avança para o passo 2
            } else {
                setErrorMessage(response.data.error || 'Não foi possível gerar tags. Tente novamente.');
                toast.error(response.data.error || 'Erro ao gerar tags.');
            }
        } catch (error) {
            console.error('Erro ao gerar tags com IA:', error);
            setErrorMessage(error.response?.data?.error || 'Erro de conexão ao gerar tags.');
            toast.error(error.response?.data?.error || 'Erro de conexão ao gerar tags.');
        } finally {
            setIsLoadingTags(false);
        }
    };

    // --- Função para Gerar Conteúdo do Curso com IA (Modificada para usar tags) ---
    const handleGenerateCourseContent = async () => {
        setIsLoading(true);
        setErrorMessage('');
        setPreviewData(null); // Limpa preview antiga

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
                    tags: selectedTags, // AGORA ENVIA OS NOMES DAS TAGS
                },
                config
            );

            if (response.status === 200 && response.data.coursePreview) {
                setPreviewData(response.data.coursePreview);
                setActiveStep((prevActiveStep) => prevActiveStep + 1); // Avança para o passo 3
            } else {
                setErrorMessage(response.data.error || 'Não foi possível gerar a pré-visualização do curso. Tente novamente.');
                toast.error(response.data.error || 'Erro ao gerar curso.');
            }
        } catch (error) {
            console.error('Erro ao gerar pré-visualização do curso:', error);
            setErrorMessage(error.response?.data?.error || 'Erro de conexão ao gerar curso.');
            toast.error(error.response?.data?.error || 'Erro de conexão ao gerar curso.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Função para Salvar o Curso Gerado (Modificada para desabilitar botão e mostrar card) ---
    const handleSaveGeneratedCourse = async () => {
        if (!previewData || isLoadingSave) return; // Impede múltiplos cliques

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
                    courseData: previewData,
                    category: selectedCategory,
                    subCategory: selectedSubCategory,
                    level: selectedLevel,
                    tags: selectedTags, // Envia os nomes das tags
                },
                config
            );

            if (response.status === 201) {
                toast.success('Curso criado e salvo com sucesso!');
                console.log('Curso salvo com sucesso:', response.data);
                setCourseCreatedData(response.data.course); // Guarda os dados do curso criado
                setActiveStep((prevActiveStep) => prevActiveStep + 1); // Avança para o passo final de sucesso
            } else {
                setErrorMessage(response.data.error || 'Erro ao salvar o curso.');
                toast.error(response.data.error || 'Erro ao salvar o curso.');
            }
        } catch (error) {
            console.error('Erro ao salvar o curso:', error);
            setErrorMessage(error.response?.data?.error || 'Erro de conexão ao salvar o curso.');
            toast.error(error.response?.data?.error || 'Erro de conexão ao salvar o curso.');
        } finally {
            setIsLoadingSave(false);
        }
    };

    // --- Função para Gerenciar Seleção de Tags ---
    const handleTagToggle = (tag) => {
        setSelectedTags((prevTags) => {
            if (prevTags.includes(tag)) {
                return prevTags.filter((t) => t !== tag);
            } else {
                return [...prevTags, tag];
            }
        });
    };

    // --- Conteúdo do Stepper por Passo ---
    const getStepContent = (step) => {
        switch (step) {
            case 0: // Detalhes Iniciais
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                        <TextField
                            label="Tópico do Curso"
                            variant="outlined"
                            value={courseData.topic}
                            onChange={(e) => setCourseData({ ...courseData, topic: e.target.value })}
                            fullWidth
                            required
                        />
                        <FormControl fullWidth required>
                            <InputLabel id="category-label">Categoria</InputLabel>
                            <Select
                                labelId="category-label"
                                value={selectedCategory}
                                label="Categoria"
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    // Resetar subcategoria se a categoria mudar
                                    setSelectedSubCategory('');
                                }}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {selectedCategory && (
                            <FormControl fullWidth required>
                                <InputLabel id="subcategory-label">Subcategoria</InputLabel>
                                <Select
                                    labelId="subcategory-label"
                                    value={selectedSubCategory}
                                    label="Subcategoria"
                                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                                >
                                    {subCategories
                                        .filter((sub) => sub.category._ref === selectedCategory)
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
                                <Typography>Gerando sugestões de tags com IA...</Typography>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h6" gutterBottom>
                                    Tags Sugeridas pela IA
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Clique para adicionar ou remover tags.
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mb: 3 }}>
                                    {aiSuggestedTags.length > 0 ? (
                                        aiSuggestedTags.map((tag, index) => (
                                            <StyledChip
                                                key={index}
                                                label={tag}
                                                selected={selectedTags.includes(tag)}
                                                onClick={() => handleTagToggle(tag)}
                                                deleteIcon={selectedTags.includes(tag) ? <Check /> : undefined}
                                                onDelete={selectedTags.includes(tag) ? () => handleTagToggle(tag) : undefined}
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body1" color="text.secondary">
                                            Nenhuma tag sugerida. Clique em "Gerar Sugestões" para tentar.
                                        </Typography>
                                    )}
                                </Box>
                                {/* Removemos o campo e botão de adicionar tag customizada aqui */}
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
                                <Typography>A IA está gerando o curso para você. Isso pode levar um momento...</Typography>
                            </Box>
                        ) : previewData ? (
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h5" gutterBottom>
                                    Pré-visualização do Curso: {previewData.title}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    {previewData.description}
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                                    Lições:
                                </Typography>
                                {previewData.lessons.map((lesson, index) => (
                                    <Box key={index} sx={{ mb: 2, borderLeft: 4, borderColor: 'primary.main', pl: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {lesson.order}. {lesson.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            Tempo estimado: {lesson.estimatedReadingTime} min
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            {lesson.content.substring(0, 150)}... {/* Mostra só o início */}
                                        </Typography>
                                    </Box>
                                ))}
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                                    Tags Associadas: {selectedTags.join(', ')}
                                </Typography>
                            </Paper>
                        ) : (
                            <Alert severity="info">
                                Detalhes do curso serão exibidos aqui após a geração.
                            </Alert>
                        )}
                    </Box>
                );
            case 3: // Confirmação e Publicação (Novo Passo de Sucesso)
                return (
                    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {isLoadingSave ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <CircularProgress />
                                <Typography>Salvando o curso e lições no Sanity...</Typography>
                            </Box>
                        ) : courseCreatedData ? (
                            <>
                                <Typography variant="h5" gutterBottom align="center">
                                    Parabéns! Seu curso foi criado com sucesso!
                                </Typography>
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

            <Box sx={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMessage}
                    </Alert>
                )}
                {getStepContent(activeStep)}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, justifyContent: 'space-between' }}>
                <Button
                    color="inherit"
                    disabled={activeStep === 0 || activeStep === steps.length - 1 || isLoading || isLoadingTags || isLoadingSave}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                >
                    Voltar
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />

                {/* Botão "Gerar Tags com IA" (Passo 1) */}
                {activeStep === 0 && (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={isLoadingTags || !courseData.topic || !selectedCategory || !selectedSubCategory || !selectedLevel}
                    >
                        {isLoadingTags ? <CircularProgress size={24} color="inherit" /> : 'Gerar Tags com IA'}
                    </Button>
                )}

                {/* Botão "Gerar Pré-visualização do Curso" (Passo 2) */}
                {activeStep === 1 && (
                    <Button
                        variant="contained"
                        onClick={handleNext} // Chama handleNext, que por sua vez chama handleGenerateCourseContent
                        disabled={isLoading || selectedTags.length === 0}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Gerar Pré-visualização do Curso'}
                    </Button>
                )}

                {/* Botão "Salvar Curso Gerado" (Passo 3) */}
                {activeStep === 2 && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveGeneratedCourse}
                        disabled={isLoadingSave || !previewData} // Desabilita se estiver salvando ou não houver preview
                    >
                        {isLoadingSave ? <CircularProgress size={24} color="inherit" /> : 'Salvar Curso Gerado'}
                    </Button>
                )}

                {/* No último passo (sucesso), não há botão "Próximo" ou "Salvar" */}
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