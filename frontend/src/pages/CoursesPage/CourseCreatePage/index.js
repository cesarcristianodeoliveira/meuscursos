// meuscursos/frontend/src/pages/CoursesPage/CourseCreatePage/index.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Stepper,
    Step,
    StepLabel,
    Button,
    Box,
    Typography,
    TextField,
    MenuItem,
    Chip,
    CircularProgress,
    Alert,
    Paper,
} from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material'; // Ícone para adicionar tag personalizada

import axios from 'axios'; // Mantido para chamadas de IA (rotas /courses/...)
import client from '../../../sanity'; // Importa o cliente Sanity configurado de src/sanity.js
import AuthContext from '../../contexts/AuthContext'; // Caminho CORRIGIDO para o seu contexto de autenticação

const CourseCreatePage = () => {
    const { auth } = useContext(AuthContext);
    const [activeStep, setActiveStep] = useState(0);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [existingTags, setExistingTags] = useState([]); // Tags existentes no Sanity (filtradas por categoria)
    const [suggestedTags, setSuggestedTags] = useState([]); // Tags sugeridas pela IA
    const [allAvailableTags, setAllAvailableTags] = useState([]); // Combinação única e ordenada de suggested e existing
    const [selectedTags, setSelectedTags] = useState([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coursePreview, setCoursePreview] = useState(null);
    const [isCourseSaved, setIsCourseSaved] = useState(false); // Novo estado para controlar se o curso foi salvo

    const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            topic: '',
            category: '',
            subCategory: '',
            level: 'iniciante', // Default para iniciante
        }
    });

    const watchedCategory = watch('category');
    const watchedTopic = watch('topic');
    const watchedSubCategory = watch('subCategory');
    const watchedLevel = watch('level');

    // --- EFEITOS DE CARREGAMENTO DE DADOS INICIAIS ---

    // Carregar categorias do Sanity
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Consulta GROQ para buscar categorias: _id e title
                const query = `*[_type == "category"]{_id, title}`;
                const data = await client.fetch(query);
                setCategories(data);
            } catch (err) {
                console.error("Erro ao buscar categorias do Sanity:", err);
                setError('Não foi possível carregar as categorias.');
            }
        };
        fetchCategories();
    }, []);

    // Carregar subcategorias do Sanity ao selecionar categoria
    useEffect(() => {
        const fetchSubCategories = async () => {
            if (watchedCategory) {
                try {
                    // Consulta GROQ para buscar subcategorias filtradas pela categoria pai
                    // Assumimos que a subCategory tem uma referência 'category' para a categoria pai
                    const query = `*[_type == "subCategory" && category._ref == $categoryId]{_id, title, category._ref}`;
                    const params = { categoryId: watchedCategory };
                    const data = await client.fetch(query, params);
                    setSubCategories(data);
                    setValue('subCategory', ''); // Limpa a subcategoria ao mudar a categoria
                } catch (err) {
                    console.error("Erro ao buscar subcategorias do Sanity:", err);
                    setError('Não foi possível carregar as subcategorias.');
                }
            } else {
                setSubCategories([]);
                setValue('subCategory', ''); // Garante que a subcategoria seja limpa se a categoria for deselecionada
            }
        };
        fetchSubCategories();
    }, [watchedCategory, setValue]);

    // --- BUSCA DE TAGS (SUGERIDAS E EXISTENTES) ---

    // Função para buscar tags existentes no Sanity (AGORA FILTRADAS POR CATEGORIA)
    const fetchExistingTags = useCallback(async (categoryId) => {
        if (!categoryId) {
            setExistingTags([]); // Limpa se não houver categoria selecionada
            return;
        }
        try {
            // Consulta GROQ para buscar tags relacionadas à categoria
            // Assumimos que o documento 'tag' tem um campo de referência 'category' para a categoria
            const query = `*[_type == "tag" && references($categoryId)]{name}`;
            const params = { categoryId: categoryId };
            const data = await client.fetch(query, params);
            // O Sanity retorna um array de objetos { name: "tag" }, mapeamos para um array de strings
            setExistingTags(data.map(tag => tag.name)); 
        } catch (err) {
            console.error("Erro ao buscar tags existentes do Sanity:", err);
            setError('Não foi possível carregar as tags existentes.');
            setExistingTags([]); // Limpa as tags existentes em caso de erro
        }
    }, []); 

    // Função para gerar tags via IA (mantendo axios para esta API externa/backend de IA)
    const generateAISuggestedTags = useCallback(async () => {
        if (!watchedTopic || !watchedCategory || !watchedSubCategory || !watchedLevel) {
            return; 
        }
        setLoading(true);
        setError(null);
        try {
            // **Esta rota e o uso de `axios` são mantidos, pois indicam uma comunicação com um backend/serviço de IA**
            const response = await axios.post('/courses/generate-tags', {
                topic: watchedTopic,
                category: watchedCategory,
                subCategory: watchedSubCategory,
                level: watchedLevel,
            }, {
                headers: { Authorization: `Bearer ${auth.accessToken}` }
            });
            setSuggestedTags(response.data.suggestedTags);
        } catch (err) {
            console.error("Erro ao gerar tags com IA:", err);
            setError(err.response?.data?.error || 'Erro ao gerar tags com IA.');
            setSuggestedTags([]);
        } finally {
            setLoading(false);
        }
    }, [watchedTopic, watchedCategory, watchedSubCategory, watchedLevel, auth.accessToken]);

    // Chamada inicial para buscar tags existentes e gerar sugeridas ao entrar no Step 2
    useEffect(() => {
        if (activeStep === 1) {
            fetchExistingTags(watchedCategory); 
            generateAISuggestedTags(); 
        }
    }, [activeStep, watchedCategory, fetchExistingTags, generateAISuggestedTags]);


    // COMBINAÇÃO E ORDENAÇÃO DE TAGS (SUGERIDAS + EXISTENTES)
    useEffect(() => {
        // Usa um Set para garantir tags únicas, ignorando case-sensitivity ao adicionar ao Set para unificação
        const uniqueTags = new Set();
        [...suggestedTags, ...existingTags].forEach(tag => {
            uniqueTags.add(tag.toLowerCase()); // Adiciona em lowercase para garantir unicidade
        });
        
        // Converte de volta para array e ordena alfabeticamente
        const combinedAndSortedTags = Array.from(uniqueTags).sort((a, b) => a.localeCompare(b));
        setAllAvailableTags(combinedAndSortedTags);
    }, [suggestedTags, existingTags]);


    // --- MANIPULAÇÃO DE TAGS SELECIONADAS ---

    const handleTagSelect = (tag) => {
        const normalizedTag = tag.toLowerCase(); // Normaliza para lowercase
        setSelectedTags(prev => {
            if (!prev.includes(normalizedTag)) {
                return [...prev, normalizedTag];
            }
            return prev;
        });
    };

    const handleRemoveTag = (tagToRemove) => {
        setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const handleAddCustomTag = () => {
        const trimmedTag = customTagInput.trim().toLowerCase();
        if (trimmedTag && !selectedTags.includes(trimmedTag)) {
            setSelectedTags(prev => [...prev, trimmedTag]);
            setCustomTagInput('');
        }
    };

    // --- NAVEGAÇÃO ENTRE STEPS ---

    const handleNext = async (data) => {
        setError(null); // Limpa erros anteriores
        if (activeStep === 0) {
            // Validações do Step 1 (já tratadas pelo hook-form, mas um extra check)
            if (!data.topic || !data.category || !data.subCategory || !data.level) {
                setError('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        } else if (activeStep === 1) {
            // Validações do Step 2
            if (selectedTags.length === 0) {
                setError('Por favor, selecione ou adicione pelo menos uma tag.');
                return;
            }
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
            // Ao ir para o Step 3, gerar a pré-visualização
            await generateCoursePreview(data.topic, data.category, data.subCategory, data.level, selectedTags);
        } else if (activeStep === 2) {
            // Salvar curso
            await saveCourse(data); // Passa 'data' para ter acesso aos campos do formulário
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        setError(null); // Limpa erros ao voltar
        // Se voltar para o step 1, limpa a pré-visualização para que seja gerada novamente se necessário
        if (activeStep === 2) {
            setCoursePreview(null);
        }
    };

    // --- GERAÇÃO E SALVAMENTO DE CURSO ---

    // Função para gerar pré-visualização do curso via IA (mantendo axios)
    const generateCoursePreview = useCallback(async (topic, category, subCategory, level, tags) => {
        setLoading(true);
        setError(null);
        setCoursePreview(null); // Limpa a pré-visualização antiga
        try {
            // **Esta rota e o uso de `axios` são mantidos, pois indicam uma comunicação com um backend/serviço de IA**
            const response = await axios.post('/courses/generate-preview', {
                topic,
                category,
                subCategory,
                level,
                tags, // Passa as tags selecionadas para a IA
            }, {
                headers: { Authorization: `Bearer ${auth.accessToken}` }
            });
            setCoursePreview(response.data.coursePreview);
            console.log("Pré-visualização do curso gerada:", response.data.coursePreview);
        } catch (err) {
            console.error("Erro ao gerar pré-visualização do curso:", err);
            setError(err.response?.data?.error || 'Erro ao gerar pré-visualização do curso.');
        } finally {
            setLoading(false);
        }
    }, [auth.accessToken]);

    const saveCourse = async (formData) => {
        if (!coursePreview) {
            setError('Nenhuma pré-visualização do curso para salvar.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Prepara o documento para ser salvo no Sanity
            // Certifique-se de que o '_type' corresponde ao seu schema de curso no Sanity
            const doc = {
                _type: 'course', // O tipo de documento 'course' no seu schema Sanity
                title: coursePreview.title,
                description: coursePreview.description,
                lessons: coursePreview.lessons.map(lesson => ({
                    _type: 'lessonBlock', // Exemplo: se suas lições são um array de objetos com um tipo específico
                    title: lesson.title,
                    content: lesson.content,
                    estimatedReadingTime: lesson.estimatedReadingTime,
                })),
                category: {
                    _type: 'reference', // Indica que é uma referência a outro documento
                    _ref: formData.category, // O _id da categoria selecionada
                },
                subCategory: {
                    _type: 'reference',
                    _ref: formData.subCategory, // O _id da subcategoria selecionada
                },
                level: formData.level,
                // Assumindo que 'tags' é um array de strings no seu schema Sanity de curso.
                // Se o seu schema exigir referências para documentos 'tag' separados,
                // você precisaria primeiro criar ou obter os _ids dessas tags.
                tags: selectedTags, 
                aiModelUsed: coursePreview.aiModelUsed,
                // Se você tiver um campo de autor no seu schema de curso, você pode adicioná-lo aqui:
                // author: {
                //     _type: 'reference',
                //     _ref: auth.user._id, // Assumindo que auth.user._id contém o ID do usuário logado
                // },
            };

            const response = await client.create(doc); // Usa client.create() para salvar no Sanity
            console.log("Curso salvo com sucesso no Sanity:", response);
            setIsCourseSaved(true); // Marca o curso como salvo
            setActiveStep(3); // Avança para o passo final
        } catch (err) {
            console.error("Erro ao salvar curso no Sanity:", err);
            setError(err.message || 'Erro ao salvar curso no Sanity.');
        } finally {
            setLoading(false);
        }
    };

    // --- Renderização dos Steps ---

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Detalhes do Curso</Typography>
                        <Controller
                            name="topic"
                            control={control}
                            rules={{ required: 'Tópico é obrigatório' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Tópico do Curso"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.topic}
                                    helperText={errors.topic ? errors.topic.message : ''}
                                />
                            )}
                        />
                        <Controller
                            name="category"
                            control={control}
                            rules={{ required: 'Categoria é obrigatória' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Categoria"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.category}
                                    helperText={errors.category ? errors.category.message : ''}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat._id} value={cat._id}>
                                            {cat.title}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                        <Controller
                            name="subCategory"
                            control={control}
                            rules={{ required: 'Subcategoria é obrigatória' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Subcategoria"
                                    fullWidth
                                    margin="normal"
                                    disabled={!watchedCategory || subCategories.length === 0} // Desabilita se não houver categoria selecionada ou subcategorias para ela
                                    error={!!errors.subCategory}
                                    helperText={errors.subCategory ? errors.subCategory.message : ''}
                                >
                                    {subCategories.length > 0 ? (
                                        subCategories.map((subCat) => (
                                            <MenuItem key={subCat._id} value={subCat._id}>
                                                {subCat.title}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem value="" disabled>Selecione uma categoria primeiro ou não há subcategorias</MenuItem>
                                    )}
                                </TextField>
                            )}
                        />
                        <Controller
                            name="level"
                            control={control}
                            rules={{ required: 'Nível de dificuldade é obrigatório' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Nível de Dificuldade"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.level}
                                    helperText={errors.level ? errors.level.message : ''}
                                >
                                    <MenuItem value="iniciante">Iniciante</MenuItem>
                                    <MenuItem value="intermediário">Intermediário</MenuItem>
                                    <MenuItem value="avançado">Avançado</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Gerar e Selecionar Tags</Typography>
                        {loading && <CircularProgress size={24} sx={{ my: 2 }} />}
                        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

                        {/* Lista Unificada de Tags Sugeridas + Existentes */}
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                            Tags Disponíveis (Sugeridas pela IA e Existentes para esta Categoria):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, border: '1px solid #ccc', p: 1, borderRadius: '4px', minHeight: '60px' }}>
                            {allAvailableTags.length > 0 ? (
                                allAvailableTags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onClick={() => handleTagSelect(tag)}
                                        color={selectedTags.includes(tag) ? 'primary' : 'default'}
                                        variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                                        clickable
                                    />
                                ))
                            ) : (
                                !loading && <Typography variant="body2" color="text.secondary">Nenhuma tag disponível para esta categoria ou tópico. Verifique os detalhes do curso ou tente gerar novamente.</Typography>
                            )}
                        </Box>

                        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Tags Selecionadas:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '60px', border: '1px solid #ccc', p: 1, borderRadius: '4px' }}>
                            {selectedTags.length > 0 ? (
                                selectedTags.map((tag) => (
                                    <Chip
                                        key={`selected-${tag}`}
                                        label={tag}
                                        onDelete={() => handleRemoveTag(tag)} // onDelete para remover o chip
                                        color="secondary"
                                    />
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary">Nenhuma tag selecionada ainda.</Typography>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <TextField
                                label="Adicionar Tag Personalizada"
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                fullWidth
                                onKeyPress={(e) => { // Permite adicionar tag com Enter
                                    if (e.key === 'Enter') {
                                        e.preventDefault(); // Evita submeter o formulário
                                        handleAddCustomTag();
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleAddCustomTag}
                                startIcon={<AddCircleOutline />}
                                sx={{ whiteSpace: 'nowrap' }} // Impede a quebra de linha no botão
                            >
                                Adicionar
                            </Button>
                        </Box>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Pré-visualização do Curso</Typography>
                        {loading && <CircularProgress size={24} sx={{ my: 2 }} />}
                        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
                        {coursePreview && (
                            <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
                                <Typography variant="h5" gutterBottom>{coursePreview.title}</Typography>
                                <Typography variant="body1" color="text.secondary">{coursePreview.description}</Typography>
                                <Typography variant="subtitle1" sx={{ mt: 2 }}>Lições:</Typography>
                                <Box component="ol" sx={{ pl: 2 }}> {/* Usando <ol> para lista ordenada */}
                                    {coursePreview.lessons && coursePreview.lessons.map((lesson, index) => (
                                        <li key={index} style={{ marginBottom: '10px' }}>
                                            <Typography variant="subtitle2">{lesson.title}</Typography>
                                            <Typography variant="body2" sx={{ ml: 2 }}>{lesson.content}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                                Tempo de leitura estimado: {lesson.estimatedReadingTime} minutos
                                            </Typography>
                                        </li>
                                    ))}
                                </Box>
                                <Typography variant="subtitle1" sx={{ mt: 2 }}>Tags:</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {coursePreview.tags && coursePreview.tags.map((tag, index) => (
                                        <Chip key={index} label={tag} variant="outlined" size="small" />
                                    ))}
                                </Box>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    Modelo de IA usado: {coursePreview.aiModelUsed}
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                );
            case 3:
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h5" gutterBottom>Curso Criado com Sucesso!</Typography>
                        <Typography variant="body1">Seu curso foi salvo e está pronto para ser acessado.</Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => { /* Implemente a navegação para a dashboard ou lista de cursos */ }}
                            sx={{ mt: 3 }}
                        >
                            Ver Meus Cursos
                        </Button>
                    </Box>
                );
            default:
                return 'Etapa desconhecida';
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 3, mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                Criar Novo Curso
            </Typography>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                <Step><StepLabel>Detalhes do Curso</StepLabel></Step>
                <Step><StepLabel>Gerar e Selecionar Tags</StepLabel></Step>
                <Step><StepLabel>Pré-visualizar e Salvar</StepLabel></Step>
                <Step><StepLabel>Concluído</StepLabel></Step>
            </Stepper>

            {/* Renderiza o conteúdo do step apenas se não estiver na etapa final de sucesso */}
            {!isCourseSaved && (
                <form onSubmit={handleSubmit(handleNext)}>
                    {getStepContent(activeStep)}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, p: 3, borderTop: '1px solid #eee' }}>
                        <Button
                            disabled={activeStep === 0 || loading}
                            onClick={handleBack}
                            variant="outlined"
                        >
                            Voltar
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            disabled={loading}
                        >
                            {activeStep === 0 ? 'Próximo' : activeStep === 1 ? 'Pré-visualizar Curso' : 'Salvar Curso'}
                        </Button>
                    </Box>
                </form>
            )}
            {/* Se o curso foi salvo, mostra apenas o conteúdo do Step 3 (Concluído) */}
            {isCourseSaved && getStepContent(activeStep)}
        </Box>
    );
};

export default CourseCreatePage;