// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\SelectImageStep.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Grid,
    Card,
    CardMedia,
    CardActionArea,
    CardContent
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function SelectImageStep({
    selectedCategory,
    selectedSubcategory,
    selectedTags,
    onImageSelectAndAdvance,
    onGoBack,
    onShowAlert,
    userToken,
    selectedImage // Prop para manter a imagem selecionada
}) {
    const [images, setImages] = useState([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [errorImages, setErrorImages] = useState(null);
    const [selectedLocalImage, setSelectedLocalImage] = useState(selectedImage || null); // Estado local para a imagem selecionada

    // Função para buscar imagens do Pixabay
    const fetchImages = useCallback(async () => {
        if (!userToken) {
            setErrorImages("Usuário não autenticado. Não é possível buscar imagens.");
            setImages([]);
            onShowAlert("Você precisa estar logado para buscar imagens.", "warning");
            return;
        }

        setLoadingImages(true);
        setErrorImages(null);
        try {
            // Constrói o termo de busca combinando categoria, subcategoria e tags
            let searchTerm = '';
            if (selectedSubcategory && selectedSubcategory.name) {
                searchTerm += selectedSubcategory.name;
            } else if (selectedCategory && selectedCategory.name) {
                searchTerm += selectedCategory.name;
            }

            if (selectedTags && selectedTags.length > 0) {
                // Adiciona as tags, limitando a 3 para não criar uma query muito longa
                const tagNames = selectedTags.map(tag => tag.name).slice(0, 3).join(' ');
                searchTerm += ` ${tagNames}`;
            }

            if (!searchTerm.trim()) {
                setErrorImages("Nenhuma categoria, subcategoria ou tag selecionada para buscar imagens.");
                setLoadingImages(false);
                return;
            }

            console.log(`[Frontend] Buscando imagens Pixabay para: "${searchTerm.trim()}"`);

            const response = await axios.get(`${API_BASE_URL}/api/pixabay-images`, {
                params: {
                    searchQuery: searchTerm.trim()
                },
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });

            // Pega 9 imagens aleatórias se houver mais de 9, ou todas se houver menos
            const fetchedImages = Array.isArray(response.data) ? response.data : [];
            const shuffledImages = fetchedImages.sort(() => 0.5 - Math.random()); // Embaralha
            const random9Images = shuffledImages.slice(0, 9); // Pega as primeiras 9

            setImages(random9Images);
            if (random9Images.length === 0) {
                onShowAlert('Nenhuma imagem encontrada para os termos de busca. Tente ajustar as tags.', 'info');
            }

        } catch (err) {
            console.error('Erro ao buscar imagens do Pixabay:', err);
            setImages([]);
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    setErrorImages('Erro de rede: O servidor backend pode não estar rodando ou está inacessível.');
                    onShowAlert('Erro de conexão com o servidor de imagens. Tente novamente.', 'error');
                } else if (err.response) {
                    setErrorImages(`Erro do servidor: ${err.response.status} - ${err.response.data.message || 'Erro desconhecido.'}`);
                    onShowAlert(`Erro ao buscar imagens: ${err.response.data.message || 'Algo deu errado no servidor.'}`, 'error');
                }
            } else {
                setErrorImages('Ocorreu um erro desconhecido ao carregar imagens.');
                onShowAlert('Ocorreu um erro inesperado ao carregar imagens.', 'error');
            }
        } finally {
            setLoadingImages(false);
        }
    }, [userToken, selectedCategory, selectedSubcategory, selectedTags, onShowAlert]);

    // Efeito para carregar imagens quando as tags, subcategoria ou categoria mudam
    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    // Handler para selecionar uma imagem
    const handleImageClick = useCallback((image) => {
        setSelectedLocalImage(image);
        onShowAlert(`Imagem selecionada.`, 'info');
    }, [onShowAlert]);

    // Handler para o botão "Próximo"
    const handleNextClick = () => {
        if (!selectedLocalImage) {
            onShowAlert('Por favor, selecione uma imagem para o curso.', 'warning');
            return;
        }
        onImageSelectAndAdvance(selectedLocalImage);
    };

    // Verifica se os dados necessários para buscar imagens estão presentes
    const hasSelectionForSearch = (selectedCategory || selectedSubcategory) && selectedTags.length > 0;

    if (!hasSelectionForSearch) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="warning">
                    Por favor, selecione uma categoria/subcategoria e pelo menos uma tag para buscar imagens.
                </Alert>
                <Button variant="outlined" onClick={onGoBack} sx={{ mt: 2 }}>
                    Voltar para Tags
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
                Passo 4: Selecione uma Imagem para o Curso
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ px: 2, pb: 2 }}>
                Selecione uma imagem visualmente atraente para representar seu curso.
            </Typography>

            {loadingImages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <CircularProgress />
                </Box>
            ) : errorImages ? (
                <Alert severity="error" sx={{ m: 2 }}>{errorImages}</Alert>
            ) : (
                <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                        {images.length === 0 ? (
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', my: 4 }}>
                                    Nenhuma imagem encontrada para os termos de busca selecionados.
                                </Typography>
                            </Grid>
                        ) : (
                            images.map((image) => (
                                <Grid item xs={12} sm={6} md={4} key={image.id}>
                                    <Card
                                        sx={{
                                            border: selectedLocalImage && selectedLocalImage.id === image.id ? '2px solid' : '1px solid',
                                            borderColor: selectedLocalImage && selectedLocalImage.id === image.id ? 'primary.main' : 'grey.300',
                                            borderRadius: '8px',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                boxShadow: 6,
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        <CardActionArea onClick={() => handleImageClick(image)}>
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={image.webformatURL} // Use webformatURL para exibição
                                                alt={image.tags}
                                                sx={{ objectFit: 'cover' }}
                                            />
                                            <CardContent sx={{ p: 1 }}>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    Por: {image.user}
                                                </Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))
                        )}
                    </Grid>
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, p: 2 }}>
                <Button variant="outlined" onClick={onGoBack}>
                    Voltar para Tags
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNextClick}
                    disabled={!selectedLocalImage || loadingImages} // Desabilita se nenhuma imagem for selecionada ou estiver carregando
                >
                    Próximo
                </Button>
            </Box>
        </Box>
    );
}

export default SelectImageStep;
