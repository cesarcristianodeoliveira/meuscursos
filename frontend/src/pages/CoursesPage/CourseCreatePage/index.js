import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

// Material UI Imports
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    CircularProgress,
    Card,
    CardContent,
    CardMedia,
    Chip,
    InputAdornment,
    TextField,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
// import VisibilityIcon from '@mui/icons-material/Visibility'; // <-- REMOVA ESTA LINHA

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const steps = [
    'Escolha a Categoria',
    'Escolha a Subcategoria',
    'Selecione as Tags',
    'Defina o Nível',
    'Gere os Títulos',
    'Selecione a Imagem',
    'Pré-visualizar Curso',
    'Curso Criado!'
];

const CourseCreatePage = () => {
    const navigate = useNavigate();
    // Apenas desestruture o user normalmente, sem precisar de isAdmin aqui.
    // Usaremos user?.isAdmin diretamente nos componentes filhos.
    const { user, userToken, isAuthenticated, isLoadingAuthInitial } = useAuth();

    const [activeStep, setActiveStep] = useState(0); // Começa no primeiro passo (índice 0)
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const [courseCreationData, setCourseCreationData] = useState({
        prompt: '', // Este será preenchido implicitamente pelos passos 1-3 e prompt opcional
        category: null,
        subCategory: null,
        tags: [],
        level: 'beginner', // Padrão: Iniciante
        selectedTitle: '',
        selectedImageUrl: '',
        generatedCoursePreview: null,
        finalCourseId: null // Para armazenar o ID do curso salvo
    });

    useEffect(() => {
        if (isLoadingAuthInitial) {
            return;
        }
        if (!isAuthenticated) {
            setFeedback({ message: 'Você precisa estar logado para criar um curso.', type: 'error' });
            // navigate('/login'); // Descomente e ajuste se tiver uma rota de login
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isLoadingAuthInitial, navigate]);

    const getAuthHeaders = () => {
        if (!userToken) {
            console.error('Token de autenticação não disponível.');
            return {};
        }
        return {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        };
    };

    const handleNext = () => {
        setFeedback({ message: '', type: '' }); // Limpa feedback ao avançar
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setFeedback({ message: '', type: '' }); // Limpa feedback ao retroceder
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setCourseCreationData({
            prompt: '',
            category: null,
            subCategory: null,
            tags: [],
            level: 'beginner',
            selectedTitle: '',
            selectedImageUrl: '',
            generatedCoursePreview: null,
            finalCourseId: null
        });
        setFeedback({ message: '', type: '' });
        setIsLoading(false);
    };

    // --- Passo 1: Escolha de Categoria ---
    const Step1_CategorySelection = () => {
        const [categories, setCategories] = useState([]);
        const [fetchingCategories, setFetchingCategories] = useState(false);

        useEffect(() => {
            const fetchCategories = async () => {
                setFetchingCategories(true);
                setFeedback({ message: 'Buscando categorias...', type: 'info' });
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/courses/create/top-categories`, getAuthHeaders());
                    if (response.data && Array.isArray(response.data.categories)) {
                        setCategories(response.data.categories);
                        setFeedback({ message: '', type: '' });
                    } else {
                        setFeedback({ message: 'Nenhuma categoria encontrada.', type: 'error' });
                    }
                } catch (error) {
                    console.error('Erro ao buscar categorias:', error);
                    setFeedback({ message: 'Erro ao carregar categorias. Tente novamente.', type: 'error' });
                } finally {
                    setFetchingCategories(false);
                }
            };

            if (isAuthenticated) {
                fetchCategories();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isAuthenticated]);

        const handleCategorySelect = (category) => {
            setCourseCreationData(prev => ({ ...prev, category, subCategory: null, tags: [] }));
            setFeedback({ message: `Categoria selecionada: ${category.title}`, type: 'success' });
        };

        const canProceed = courseCreationData.category && !fetchingCategories;

        return (
            <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Escolha a Categoria Principal (Obrigatório)</Typography>
                {fetchingCategories && <CircularProgress size={24} />}
                {!fetchingCategories && categories.length === 0 && (
                    <Typography color="error">Nenhuma categoria disponível. Verifique o backend ou adicione categorias no Sanity.</Typography>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {categories.map(cat => (
                        <Button
                            key={cat._id}
                            variant={courseCreationData.category && courseCreationData.category._id === cat._id ? 'contained' : 'outlined'}
                            onClick={() => handleCategorySelect(cat)}
                        >
                            {cat.title}
                        </Button>
                    ))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceed}
                        endIcon={<SendIcon />}
                    >
                        Próximo
                    </Button>
                </Box>
            </Box>
        );
    };

    // --- Passo 2: Escolha de Subcategoria ---
    const Step2_SubCategorySelection = () => {
        const [subCategories, setSubCategories] = useState([]);
        const [fetchingSubCategories, setFetchingSubCategories] = useState(false);

        useEffect(() => {
            const fetchSubCategories = async () => {
                if (!courseCreationData.category) return; // Não busca se não houver categoria
                setFetchingSubCategories(true);
                setFeedback({ message: 'Buscando subcategorias...', type: 'info' });
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/courses/create/top-subcategories?categoryId=${courseCreationData.category._id}`, getAuthHeaders());
                    if (response.data && Array.isArray(response.data.subCategories)) {
                        setSubCategories(response.data.subCategories);
                        setFeedback({ message: '', type: '' });
                    } else {
                        setFeedback({ message: 'Nenhuma subcategoria encontrada para esta categoria.', type: 'info' });
                        setSubCategories([]);
                    }
                } catch (error) {
                    console.error('Erro ao buscar subcategorias:', error);
                    setFeedback({ message: 'Erro ao carregar subcategorias. Tente novamente.', type: 'error' });
                } finally {
                    setFetchingSubCategories(false);
                }
            };

            if (courseCreationData.category && isAuthenticated) {
                fetchSubCategories();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [courseCreationData.category, isAuthenticated]);

        const handleSubCategorySelect = (subCat) => {
            setCourseCreationData(prev => ({ ...prev, subCategory: subCat, tags: [] }));
            setFeedback({ message: `Subcategoria selecionada: ${subCat.title}`, type: 'success' });
        };

        const canProceed = courseCreationData.subCategory && !fetchingSubCategories;

        return (
            <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Escolha a Subcategoria (Obrigatório)</Typography>
                {courseCreationData.category ? (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Categoria selecionada: <Typography component="span" fontWeight="medium">{courseCreationData.category.title}</Typography>
                        </Typography>
                        {fetchingSubCategories && <CircularProgress size={24} />}
                        {!fetchingSubCategories && subCategories.length === 0 && (
                            <Typography color="text.secondary">Nenhuma subcategoria disponível para esta categoria.</Typography>
                        )}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                            {subCategories.map(subCat => (
                                <Button
                                    key={subCat._id}
                                    variant={courseCreationData.subCategory && courseCreationData.subCategory._id === subCat._id ? 'contained' : 'outlined'}
                                    onClick={() => handleSubCategorySelect(subCat)}
                                >
                                    {subCat.title}
                                </Button>
                            ))}
                        </Box>
                    </>
                ) : (
                    <Typography color="error">Por favor, retorne ao Passo 1 e selecione uma categoria.</Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
                        Anterior
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceed}
                        endIcon={<SendIcon />}
                    >
                        Próximo
                    </Button>
                </Box>
            </Box>
        );
    };

    // --- Passo 3: Escolha de Tags ---
    const Step3_TagSelection = () => {
        const [suggestedTags, setSuggestedTags] = useState([]);
        const [fetchingTags, setFetchingTags] = useState(false);
        const [newTagInput, setNewTagInput] = useState('');
        const newTagInputRef = useRef(null);

        useEffect(() => {
            const fetchTags = async () => {
                if (!courseCreationData.category || !courseCreationData.subCategory) {
                    setFeedback({ message: 'Por favor, selecione categoria e subcategoria para ver as tags.', type: 'error' });
                    return;
                }
                setFetchingTags(true);
                setFeedback({ message: 'Buscando tags sugeridas...', type: 'info' });
                try {
                    const response = await axios.get(
                        `${API_BASE_URL}/api/courses/create/top-tags?categoryId=${courseCreationData.category._id}&subCategoryId=${courseCreationData.subCategory._id}`,
                        getAuthHeaders()
                    );

                    if (response.data && Array.isArray(response.data.tags)) {
                        setSuggestedTags(response.data.tags);
                        setFeedback({ message: '', type: '' });
                    } else {
                        setFeedback({ message: 'Nenhuma tag sugerida encontrada para as seleções atuais.', type: 'info' });
                        setSuggestedTags([]);
                    }
                } catch (error) {
                    console.error('Erro ao buscar tags:', error);
                    setFeedback({ message: 'Erro ao carregar tags. Tente novamente.', type: 'error' });
                } finally {
                    setFetchingTags(false);
                }
            };

            if (isAuthenticated && courseCreationData.category && courseCreationData.subCategory) {
                fetchTags();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [courseCreationData.category, courseCreationData.subCategory, isAuthenticated]);

        const handleTagToggle = (tag) => {
            setCourseCreationData(prev => {
                const isSelected = prev.tags.some(t => t._id === tag._id);
                let newTags;
                if (isSelected) {
                    newTags = prev.tags.filter(t => t._id !== tag._id);
                } else {
                    if (prev.tags.length >= 3) {
                        setFeedback({ message: 'Você pode selecionar no máximo 3 tags.', type: 'error' });
                        return prev;
                    }
                    newTags = [...prev.tags, tag];
                }
                return { ...prev, tags: newTags };
            });
        };

        const handleAddCustomTag = () => {
            const trimmedTag = newTagInput.trim();
            if (trimmedTag && trimmedTag.length >= 2 && trimmedTag.length <= 50) {
                if (courseCreationData.tags.length >= 3) {
                    setFeedback({ message: 'Você pode adicionar no máximo 3 tags.', type: 'error' });
                    return;
                }
                const isDuplicate = courseCreationData.tags.some(tag => tag.name.toLowerCase() === trimmedTag.toLowerCase()) ||
                                   suggestedTags.some(tag => tag.name.toLowerCase() === trimmedTag.toLowerCase());
                if (isDuplicate) {
                    setFeedback({ message: `A tag "${trimmedTag}" já foi adicionada ou sugerida.`, type: 'error' });
                } else {
                    setCourseCreationData(prev => ({
                        ...prev,
                        tags: [...prev.tags, { _id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, name: trimmedTag }]
                    }));
                    setNewTagInput('');
                    setFeedback({ message: `Tag "${trimmedTag}" adicionada!`, type: 'success' });
                    if (newTagInputRef.current) newTagInputRef.current.focus();
                }
            } else {
                setFeedback({ message: 'O nome da tag deve ter entre 2 e 50 caracteres.', type: 'error' });
            }
        };

        const handleRemoveSelectedTag = (tagId) => {
            setCourseCreationData(prev => ({
                ...prev,
                tags: prev.tags.filter(t => t._id !== tagId)
            }));
            setFeedback({ message: 'Tag removida.', type: 'info' });
        };

        const canProceed = courseCreationData.tags.length >= 1 && !fetchingTags;

        return (
            <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Escolha as Tags do Curso (Mínimo 1, Máximo 3)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Selecione as tags que melhor descrevem seu curso. Você pode escolher entre as sugeridas.
                    {user?.isAdmin && " Se for administrador, pode adicionar as suas."} {/* <--- USANDO user?.isAdmin AQUI */}
                </Typography>

                {/* Tags Sugeridas */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Tags Sugeridas:</Typography>
                    {fetchingTags && <CircularProgress size={24} />}
                    {!fetchingTags && suggestedTags.length === 0 && (
                        <Typography color="text.secondary">Nenhuma tag sugerida para as seleções atuais.</Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {suggestedTags.map(tag => (
                            <Chip
                                key={tag._id}
                                label={tag.name}
                                onClick={() => handleTagToggle(tag)}
                                color={courseCreationData.tags.some(t => t._id === tag._id) ? 'primary' : 'default'}
                                variant={courseCreationData.tags.some(t => t._id === tag._id) ? 'contained' : 'outlined'}
                                icon={courseCreationData.tags.some(t => t._id === tag._id) ? <CheckCircleIcon /> : undefined}
                                clickable
                            />
                        ))}
                    </Box>
                </Box>

                {/* Adicionar Nova Tag - VISÍVEL APENAS PARA ADMIN */}
                {user?.isAdmin && ( // <--- USANDO user?.isAdmin AQUI
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Adicionar Nova Tag:</Typography>
                        <TextField
                            fullWidth
                            inputRef={newTagInputRef}
                            label="Nova Tag"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(); } }}
                            placeholder="Ex: Machine Learning"
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleAddCustomTag} edge="end" color="primary">
                                            <AddIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                )}

                {/* Tags Selecionadas */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Tags Selecionadas:</Typography>
                    {courseCreationData.tags.length === 0 && (
                        <Typography color="text.secondary">Nenhuma tag selecionada ainda.</Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {courseCreationData.tags.map(tag => (
                            <Chip
                                key={tag._id}
                                label={tag.name}
                                onDelete={() => handleRemoveSelectedTag(tag._id)}
                                color="info"
                                variant="outlined"
                                deleteIcon={<RemoveCircleOutlineIcon />}
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
                        Anterior
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceed}
                        endIcon={<SendIcon />}
                    >
                        Próximo
                    </Button>
                </Box>
            </Box>
        );
    };

    // --- Passo 4: Seleção do Nível ---
    const Step4_LevelSelection = () => {
        const handleLevelChange = (event) => {
            setCourseCreationData(prev => ({ ...prev, level: event.target.value }));
            setFeedback({ message: `Nível selecionado: ${event.target.value}`, type: 'success' });
        };

        // Como um nível padrão já é definido, `canProceed` é sempre verdadeiro
        const canProceed = !!courseCreationData.level;

        return (
            <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Selecione o Nível do Curso (Obrigatório)</Typography>
                <RadioGroup
                    aria-label="level"
                    name="level-radio-buttons-group"
                    value={courseCreationData.level}
                    onChange={handleLevelChange}
                    sx={{ mt: 2 }}
                >
                    <FormControlLabel value="beginner" control={<Radio />} label="Iniciante" />
                    <FormControlLabel value="intermediate" control={<Radio />} label="Intermediário" />
                    <FormControlLabel value="advanced" control={<Radio />} label="Avançado" />
                </RadioGroup>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
                        Anterior
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceed}
                        endIcon={<SendIcon />}
                    >
                        Próximo
                    </Button>
                </Box>
            </Box>
        );
    };

    // --- Passo 5: Geração de Títulos ---
    const Step5_TitleGeneration = () => {
        const [generatedTitles, setGeneratedTitles] = useState([]);

        useEffect(() => {
            const generateTitles = async () => {
                if (!courseCreationData.category || !courseCreationData.subCategory || courseCreationData.tags.length === 0) {
                    setFeedback({ message: 'Por favor, complete os passos anteriores (categoria, subcategoria e tags).', type: 'error' });
                    return;
                }

                setIsLoading(true);
                setFeedback({ message: 'Gerando 5 opções de títulos com IA...', type: 'info' });
                try {
                    const response = await axios.post(
                        `${API_BASE_URL}/api/courses/create/generate-titles`,
                        {
                            categoryTitle: courseCreationData.category.title,
                            subCategoryTitle: courseCreationData.subCategory?.title || '', // Pode ser nula
                            tagNames: courseCreationData.tags.map(t => t.name),
                            level: courseCreationData.level
                        },
                        getAuthHeaders()
                    );
                    if (response.data && Array.isArray(response.data.titles) && response.data.titles.length > 0) {
                        setGeneratedTitles(response.data.titles);
                        setFeedback({ message: 'Títulos gerados com sucesso!', type: 'success' });
                    } else {
                        setFeedback({ message: 'Não foi possível gerar títulos. Tente novamente ou ajuste suas seleções.', type: 'error' });
                        setGeneratedTitles([]);
                    }
                } catch (error) {
                    console.error('Erro ao gerar títulos:', error);
                    setFeedback({ message: `Erro ao gerar títulos: ${error.response?.data?.message || error.message}.`, type: 'error' });
                } finally {
                    setIsLoading(false);
                }
            };

            // Gera títulos automaticamente ao entrar no passo, se ainda não houver
            if (isAuthenticated && generatedTitles.length === 0 && !isLoading && activeStep === 4) { // activeStep 4 é o quinto passo
                 generateTitles();
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [courseCreationData.category, courseCreationData.subCategory, courseCreationData.tags, courseCreationData.level, isAuthenticated, activeStep]);

        const handleTitleSelect = (title) => {
            setCourseCreationData(prev => ({ ...prev, selectedTitle: title }));
            setFeedback({ message: `Título selecionado: "${title}"`, type: 'success' });
        };

        const canProceed = !!courseCreationData.selectedTitle && !isLoading;

        return (
            <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Gere e Selecione um Título para o Curso (Obrigatório)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    A inteligência artificial irá gerar 5 opções de títulos com base nas suas seleções.
                </Typography>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Gerando títulos...</Typography>
                    </Box>
                ) : generatedTitles.length === 0 ? (
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setGeneratedTitles([]); // Limpa para forçar nova geração
                            // eslint-disable-next-line no-unused-expressions
                            (async () => { // Função anônima auto-executável para chamar generateTitles
                                if (!courseCreationData.category || !courseCreationData.subCategory || courseCreationData.tags.length === 0) {
                                    setFeedback({ message: 'Por favor, complete os passos anteriores (categoria, subcategoria e tags).', type: 'error' });
                                    return;
                                }
                                setIsLoading(true);
                                setFeedback({ message: 'Gerando 5 opções de títulos com IA...', type: 'info' });
                                try {
                                    const response = await axios.post(
                                        `${API_BASE_URL}/api/courses/create/generate-titles`,
                                        {
                                            categoryTitle: courseCreationData.category.title,
                                            subCategoryTitle: courseCreationData.subCategory?.title || '',
                                            tagNames: courseCreationData.tags.map(t => t.name),
                                            level: courseCreationData.level
                                        },
                                        getAuthHeaders()
                                    );
                                    if (response.data && Array.isArray(response.data.titles) && response.data.titles.length > 0) {
                                        setGeneratedTitles(response.data.titles);
                                        setFeedback({ message: 'Títulos gerados com sucesso!', type: 'success' });
                                    } else {
                                        setFeedback({ message: 'Não foi possível gerar títulos. Tente novamente ou ajuste suas seleções.', type: 'error' });
                                        setGeneratedTitles([]);
                                    }
                                } catch (error) {
                                    console.error('Erro ao gerar títulos:', error);
                                    setFeedback({ message: `Erro ao gerar títulos: ${error.response?.data?.message || error.message}.`, type: 'error' });
                                } finally {
                                    setIsLoading(false);
                                }
                            })();
                        }}
                        startIcon={<SendIcon />}
                    >
                        Gerar Títulos
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {generatedTitles.map((title, index) => (
                            <Button
                                key={index}
                                variant={courseCreationData.selectedTitle === title ? 'contained' : 'outlined'}
                                onClick={() => handleTitleSelect(title)}
                                sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}
                            >
                                {title}
                            </Button>
                        ))}
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
                        Anterior
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceed}
                        endIcon={<SendIcon />}
                    >
                        Próximo
                    </Button>
                </Box>
            </Box>
        );
    };

    // --- Passo 6: Seleção de Imagem ---
    const Step6_ImageSelection = () => {
        const [pixabayImages, setPixabayImages] = useState([]);
        const [fetchingImages, setFetchingImages] = useState(false);

        useEffect(() => {
            const fetchImages = async () => {
                if (courseCreationData.tags.length === 0) {
                    setFeedback({ message: 'Selecione tags no Passo 3 para gerar imagens.', type: 'error' });
                    return;
                }

                setFetchingImages(true);
                setFeedback({ message: 'Buscando imagens da Pixabay...', type: 'info' });
                try {
                    const query = courseCreationData.tags.map(tag => tag.name).join(',');
                    const response = await axios.get(`${API_BASE_URL}/api/courses/create/pixabay-images?query=${encodeURIComponent(query)}`, getAuthHeaders());
                    if (response.data && Array.isArray(response.data.images) && response.data.images.length > 0) {
                        setPixabayImages(response.data.images);
                        setFeedback({ message: 'Imagens carregadas com sucesso!', type: 'success' });
                    } else {
                        setFeedback({ message: 'Nenhuma imagem encontrada para as tags selecionadas. Tente outras tags.', type: 'info' });
                        setPixabayImages([]);
                    }
                } catch (error) {
                    console.error('Erro ao buscar imagens:', error);
                    setFeedback({ message: `Erro ao carregar imagens: ${error.response?.data?.message || error.message}.`, type: 'error' });
                } finally {
                    setFetchingImages(false);
                }
            };

            if (isAuthenticated && pixabayImages.length === 0 && !fetchingImages && activeStep === 5) { // activeStep 5 é o sexto passo
                fetchImages();
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [courseCreationData.tags, isAuthenticated, activeStep]);


        const handleImageSelect = (imageUrl) => {
            setCourseCreationData(prev => ({ ...prev, selectedImageUrl: imageUrl }));
            setFeedback({ message: 'Imagem selecionada!', type: 'success' });
        };

        const canProceed = !!courseCreationData.selectedImageUrl && !fetchingImages;

        return (
            <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Selecione uma Imagem para o Curso (Obrigatório)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Escolha uma das 3 imagens sugeridas da Pixabay relacionadas às suas tags.
                    {user?.isAdmin && " Se for administrador, pode inserir uma URL de imagem própria."} {/* <--- USANDO user?.isAdmin AQUI */}
                </Typography>

                {fetchingImages ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Buscando imagens...</Typography>
                    </Box>
                ) : pixabayImages.length === 0 ? (
                    <Typography color="text.secondary">Nenhuma imagem sugerida. Por favor, ajuste as tags ou tente novamente.</Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                        {pixabayImages.map((img, index) => (
                            <Card
                                key={index}
                                sx={{
                                    width: 200,
                                    cursor: 'pointer',
                                    border: courseCreationData.selectedImageUrl === img.webformatURL ? '2px solid blue' : '1px solid #e0e0e0',
                                    boxShadow: courseCreationData.selectedImageUrl === img.webformatURL ? '0 0 8px blue' : 'none'
                                }}
                                onClick={() => handleImageSelect(img.webformatURL)}
                            >
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={img.webformatURL}
                                    alt={`Imagem ${index + 1}`}
                                />
                                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Por: {img.user}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                {/* Opção para URL de imagem própria - VISÍVEL APENAS PARA ADMIN */}
                {user?.isAdmin && ( // <--- USANDO user?.isAdmin AQUI
                    <TextField
                        fullWidth
                        label="URL de Imagem Própria (Opcional)"
                        value={courseCreationData.selectedImageUrl}
                        onChange={(e) => setCourseCreationData(prev => ({ ...prev, selectedImageUrl: e.target.value }))}
                        variant="outlined"
                        size="small"
                        sx={{ mt: 3 }}
                        helperText="Cole a URL de uma imagem aqui se desejar usar uma personalizada."
                    />
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
                        Anterior
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!canProceed}
                        endIcon={<SendIcon />}
                    >
                        Próximo
                    </Button>
                </Box>
            </Box>
        );
    };

    // --- Passo 7: Pré-visualização do Curso ---
    const Step7_CoursePreview = () => {
        const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

        useEffect(() => {
            const generatePreview = async () => {
                const { category, subCategory, tags, level, selectedTitle } = courseCreationData;
                if (!category || !subCategory || tags.length === 0 || !level || !selectedTitle) {
                    setFeedback({ message: 'Por favor, complete todos os passos anteriores para gerar a pré-visualização.', type: 'error' });
                    return;
                }

                if (courseCreationData.generatedCoursePreview) { // Não gera novamente se já tiver
                    setFeedback({ message: 'Pré-visualização já gerada. Revise o conteúdo.', type: 'info' });
                    return;
                }

                setIsGeneratingPreview(true);
                setFeedback({ message: 'Gerando pré-visualização do curso com IA...', type: 'info' });

                try {
                    const response = await axios.post(
                        `${API_BASE_URL}/api/courses/create/generate-preview`,
                        {
                            categoryTitle: category.title,
                            subCategoryTitle: subCategory?.title || '',
                            tagNames: tags.map(t => t.name),
                            level: level,
                            selectedTitle: selectedTitle
                        },
                        getAuthHeaders()
                    );

                    if (response.data && response.data.coursePreview) {
                        setCourseCreationData(prev => ({ ...prev, generatedCoursePreview: response.data.coursePreview }));
                        setFeedback({ message: 'Pré-visualização gerada com sucesso! Revise o conteúdo.', type: 'success' });
                    } else {
                        setFeedback({ message: 'Não foi possível gerar a pré-visualização do curso. Tente novamente.', type: 'error' });
                    }
                } catch (error) {
                    console.error('Erro ao gerar pré-visualização:', error);
                    setFeedback({ message: `Erro ao gerar pré-visualização: ${error.response?.data?.message || error.message}.`, type: 'error' });
                } finally {
                    setIsGeneratingPreview(false);
                }
            };

            if (isAuthenticated && !courseCreationData.generatedCoursePreview && activeStep === 6) { // activeStep 6 é o sétimo passo
                generatePreview();
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [courseCreationData.category, courseCreationData.subCategory, courseCreationData.tags, courseCreationData.level, courseCreationData.selectedTitle, isAuthenticated, activeStep]);

        const canProceed = !!courseCreationData.generatedCoursePreview && !isGeneratingPreview;

        const handleConfirmAndSave = async () => {
            if (!user || !user.id) {
                setFeedback({ message: 'ID do membro não encontrado. Faça login novamente.', type: 'error' });
                return;
            }
            if (!courseCreationData.generatedCoursePreview || !courseCreationData.selectedImageUrl) {
                setFeedback({ message: 'Pré-visualização do curso ou imagem principal ausentes.', type: 'error' });
                return;
            }

            setIsLoading(true); // Usando o isLoading global para a ação final de salvar
            setFeedback({ message: 'Salvando curso no Sanity...', type: 'info' });

            try {
                const response = await axios.post(
                    `${API_BASE_URL}/api/courses/create/save`,
                    {
                        memberId: user.id, // ID do membro vem do AuthContext
                        courseData: {
                            ...courseCreationData.generatedCoursePreview, // Conteúdo gerado pela IA
                            categoryTitle: courseCreationData.category.title,
                            subCategoryTitle: courseCreationData.subCategory?.title || null,
                            tagNames: courseCreationData.tags.map(t => t.name),
                            mainImageUrl: courseCreationData.selectedImageUrl,
                            level: courseCreationData.level
                        }
                    },
                    getAuthHeaders()
                );

                if (response.data && response.data.courseId) {
                    setCourseCreationData(prev => ({ ...prev, finalCourseId: response.data.courseId }));
                    setFeedback({ message: 'Curso salvo com sucesso!', type: 'success' });
                    handleNext(); // Avança para o passo final de confirmação
                } else {
                    setFeedback({ message: 'Erro ao salvar o curso. Tente novamente.', type: 'error' });
                }
            } catch (error) {
                console.error('Erro ao salvar curso:', error);
                setFeedback({ message: `Erro ao salvar curso: ${error.response?.data?.message || error.message}.`, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        return (
            <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Pré-visualização do Curso</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Revise o conteúdo gerado pela IA. Se tudo estiver correto, clique em "Confirmar e Publicar".
                </Typography>

                {isGeneratingPreview || isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Gerando pré-visualização...</Typography>
                    </Box>
                ) : !courseCreationData.generatedCoursePreview ? (
                    <Typography color="error">
                        Não foi possível carregar a pré-visualização. Por favor, verifique as seleções anteriores e tente novamente.
                        <Button
                            onClick={() => {
                                setCourseCreationData(prev => ({ ...prev, generatedCoursePreview: null })); // Limpa para forçar nova geração
                                // Chame a função generatePreview diretamente aqui se quiser um botão de retry
                            }}
                            sx={{ ml: 2 }}
                        >
                            Tentar Novamente
                        </Button>
                    </Typography>
                ) : (
                    <Box sx={{ border: '1px solid #e0e0e0', p: 3, borderRadius: 2, bgcolor: 'background.paper', maxHeight: '60vh', overflowY: 'auto' }}>
                        <Typography variant="h5" gutterBottom>{courseCreationData.generatedCoursePreview.title}</Typography>
                        {courseCreationData.selectedImageUrl && (
                            <CardMedia
                                component="img"
                                height="200"
                                image={courseCreationData.selectedImageUrl}
                                alt="Imagem Principal do Curso"
                                sx={{ mb: 2, borderRadius: 1 }}
                            />
                        )}
                        <Typography variant="subtitle1" fontWeight="medium" sx={{ mt: 2, mb: 1 }}>Descrição:</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{courseCreationData.generatedCoursePreview.description}</Typography>

                        <Typography variant="subtitle1" fontWeight="medium" sx={{ mt: 3, mb: 1 }}>Lições:</Typography>
                        {courseCreationData.generatedCoursePreview.lessons?.map((lesson, index) => (
                            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #f0f0f0', borderRadius: 1, bgcolor: '#fafafa' }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>{`Lição ${index + 1}: ${lesson.title}`}</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{lesson.content}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Tempo estimado de leitura: {lesson.estimatedReadingTime} min
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
                        Anterior
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmAndSave}
                        disabled={!canProceed || isLoading}
                        endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    >
                        {isLoading ? 'Publicando...' : 'Confirmar e Publicar'}
                    </Button>
                </Box>
            </Box>
        );
    };

    // --- Passo 8: Curso Criado! ---
    const Step8_CourseCreated = () => {
        const handleViewCourse = () => {
            if (courseCreationData.finalCourseId) {
                navigate(`/course/${courseCreationData.finalCourseId}`); // Ajuste para a rota real do curso
            }
        };

        return (
            <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>Parabéns! Seu curso foi criado com sucesso!</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Agora você pode visualizar o curso em sua página dedicada.
                </Typography>
                <Card sx={{ maxWidth: 400, mx: 'auto', mb: 4, boxShadow: 3 }}>
                    <CardContent>
                        <Typography variant="h6" component="div" gutterBottom>
                            {courseCreationData.generatedCoursePreview?.title || 'Curso Criado'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {courseCreationData.generatedCoursePreview?.description.substring(0, 100) + '...' || 'Descrição do curso aqui.'}
                        </Typography>
                    </CardContent>
                    <Button
                        variant="contained"
                        onClick={handleViewCourse}
                        sx={{ mb: 2 }}
                    >
                        Ver Curso
                    </Button>
                </Card>
                <Button onClick={handleReset} variant="outlined">
                    Criar Novo Curso
                </Button>
            </Box>
        );
    };

    // --- Renderização Principal do Componente ---
    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Typography variant="h4" component="h1" align="center" sx={{ mb: 4, fontWeight: 'bold', color: 'text.primary' }}>
                Criar Novo Curso com IA
            </Typography>

            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box sx={{ maxWidth: 'lg', mx: 'auto', bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <Snackbar
                    open={!!feedback.message}
                    autoHideDuration={6000}
                    onClose={() => setFeedback({ message: '', type: '' })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert onClose={() => setFeedback({ message: '', type: '' })} severity={feedback.type === 'error' ? 'error' : feedback.type === 'success' ? 'success' : 'info'} sx={{ width: '100%' }}>
                        {feedback.message}
                    </Alert>
                </Snackbar>

                {isLoadingAuthInitial ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Verificando autenticação...</Typography>
                    </Box>
                ) : !isAuthenticated ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                        <Typography variant="h6" color="error">Você precisa estar logado para criar um curso.</Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate('/login')}
                            sx={{ mt: 2 }}
                        >
                            Fazer Login
                        </Button>
                    </Box>
                ) : (
                    <>
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        {activeStep === 0 && <Step1_CategorySelection />}
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        {activeStep === 1 && <Step2_SubCategorySelection />}
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        {activeStep === 2 && <Step3_TagSelection />}
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        {activeStep === 3 && <Step4_LevelSelection />}
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        {activeStep === 4 && <Step5_TitleGeneration />}
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        {activeStep === 5 && <Step6_ImageSelection />}
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        {activeStep === 6 && <Step7_CoursePreview />}
                        {/* eslint-disable-next-line react/jsx-pascal-case */}
                        {activeStep === 7 && <Step8_CourseCreated />}
                    </>
                )}
            </Box>
        </Box>
    );
};

export default CourseCreatePage;