// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\ReviewAndCreateStep.js

import React from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Paper,
    Card,
    CardMedia,
    CardContent
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CategoryIcon from '@mui/icons-material/Category';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import TagIcon from '@mui/icons-material/LocalOffer';
import ImageIcon from '@mui/icons-material/Image';


function ReviewAndCreateStep({ selectedCategory, selectedSubcategory, selectedTags, selectedImage, onGoBack }) {
    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '8px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom sx={{ p: 2, pb: 0 }}>
                Passo Final: Revisar e Criar Curso
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ px: 2, pb: 2 }}>
                Por favor, revise os detalhes do seu curso antes de finalizar.
            </Typography>

            <Paper elevation={0} sx={{ mx: 2, mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 1 }}>
                    Detalhes Selecionados:
                </Typography>
                <List dense>
                    <ListItem>
                        <ListItemIcon>
                            <CategoryIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Categoria" secondary={selectedCategory?.name || 'N/A'} />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                        <ListItemIcon>
                            <SubdirectoryArrowRightIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText primary="Subcategoria" secondary={selectedSubcategory?.name || 'N/A'} />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                        <ListItemIcon>
                            <TagIcon color="info" />
                        </ListItemIcon>
                        <ListItemText 
                            primary="Tags" 
                            secondary={selectedTags.length > 0 ? selectedTags.map(tag => tag.name).join(', ') : 'N/A'} 
                        />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                        <ListItemIcon>
                            <ImageIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary="Imagem do Curso" />
                    </ListItem>
                    {selectedImage ? (
                        <Card sx={{ maxWidth: 345, mx: 'auto', mt: 1, mb: 2 }}>
                            <CardMedia
                                component="img"
                                height="140"
                                image={selectedImage.webformatURL} // Exibe a imagem selecionada
                                alt={selectedImage.tags}
                                sx={{ objectFit: 'cover' }}
                            />
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    Por: {selectedImage.user}
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        <Typography variant="body2" color="textSecondary" sx={{ ml: 7, mb: 1 }}>
                            Nenhuma imagem selecionada.
                        </Typography>
                    )}
                </List>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, p: 2 }}>
                <Button variant="outlined" onClick={onGoBack}>
                    Voltar para Imagem
                </Button>
                <Button variant="contained" color="success" startIcon={<CheckCircleOutlineIcon />}>
                    Criar Curso
                </Button>
            </Box>
        </Box>
    );
}

export default ReviewAndCreateStep;
