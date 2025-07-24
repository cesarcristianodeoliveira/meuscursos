// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\AdminAddTagModal.js

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Typography,
    Box,
    Chip
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function AdminAddTagModal({ 
    open, 
    onClose, 
    isAuthenticated, 
    userToken, 
    onTagCreated, 
    onShowAlert, 
    selectedCategory, 
    selectedSubcategory,
    onTagsListUpdated // NOVO PROP: Callback para notificar que a lista de tags precisa ser atualizada
}) {
    const [newTagTitle, setNewTagTitle] = useState('');
    const [addingTag, setAddingTag] = useState(false);

    // Limpa o campo de título quando o modal é aberto
    useEffect(() => {
        if (open) {
            setNewTagTitle('');
        }
    }, [open]);

    // Condição para habilitar/desabilitar o botão "Criar"
    const isCreateButtonDisabled = addingTag || newTagTitle.trim().length < 2; // Tags podem ser mais curtas

    const handleCreateTag = async () => {
        if (!newTagTitle.trim()) {
            onShowAlert('O título da tag não pode ser vazio.', 'warning');
            return;
        }
        if (!isAuthenticated) {
            onShowAlert('Você precisa estar logado para criar uma tag.', 'error');
            return;
        }

        setAddingTag(true);
        try {
            const categoryIds = [];
            const categoryNames = [];

            // Adiciona a subcategoria se existir e for válida
            if (selectedSubcategory && selectedSubcategory._id && selectedSubcategory.name) {
                categoryIds.push(selectedSubcategory._id);
                categoryNames.push(selectedSubcategory.name);
            }
            // Adiciona a categoria principal se existir, for válida E não for a mesma da subcategoria
            // Isso evita adicionar a categoria pai duas vezes se a subcategoria já a referencia
            const isParentCategoryAlreadyAdded = selectedSubcategory && selectedSubcategory.parentCategoryId === selectedCategory._id;
            if (selectedCategory && selectedCategory._id && selectedCategory.name && !isParentCategoryAlreadyAdded) {
                categoryIds.push(selectedCategory._id);
                categoryNames.push(selectedCategory.name);
            }

            // Para o caso de uma subcategoria Gemini estar sendo criada junto com a tag,
            // precisamos passar o objeto da categoria pai real para o backend.
            // O frontend já envia selectedCategory e selectedSubcategory.
            // O backend (tagsController.js) terá que inferir qual é o parentCategoryForSubcategoryGemini
            // a partir de selectedCategory se selectedSubcategory for Gemini.
            let parentCategoryForSubcategoryGemini = null;
            if (selectedSubcategory && selectedSubcategory._id.startsWith('gemini-') && selectedCategory) {
                 parentCategoryForSubcategoryGemini = selectedCategory;
            }


            const response = await axios.post(`${API_BASE_URL}/api/tags`, 
                { 
                    title: newTagTitle.trim(),
                    categoryIds: categoryIds, // Envia os IDs das categorias/subcategorias associadas
                    categoryNames: categoryNames, // Envia os nomes para ajudar na lógica do backend
                    parentCategoryForSubcategoryGemini: parentCategoryForSubcategoryGemini // Envia a categoria pai se subcat for Gemini
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );
            const createdTag = response.data; 

            onShowAlert(`Tag "${createdTag.name}" criada com sucesso!`, 'success');
            onTagCreated(createdTag); // Notifica o componente pai (CourseCreatePage)
            
            // NOVO: Notifica o SelectTagsStep para recarregar as tags
            if (onTagsListUpdated) {
                onTagsListUpdated(); 
            }

            onClose(); 

        } catch (error) {
            console.error('Erro ao criar tag:', error.response?.data || error.message);
            // Captura a mensagem de erro do backend (ex: "Esta tag já existe.")
            const errorMessage = error.response?.data?.message || 'Erro ao criar tag. Tente novamente.';
            onShowAlert(errorMessage, 'error');
        } finally {
            setAddingTag(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Criar Nova Tag</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        Associar à:
                    </Typography>
                    {selectedCategory && (
                        <Chip label={`Categoria: ${selectedCategory.name}`} size="small" color="primary" sx={{ mr: 1, mb: 1 }} />
                    )}
                    {selectedSubcategory && (
                        <Chip label={`Subcategoria: ${selectedSubcategory.name}`} size="small" color="secondary" sx={{ mr: 1, mb: 1 }} />
                    )}
                    {!selectedCategory && !selectedSubcategory && (
                        <Typography variant="body2" color="textSecondary">
                            Nenhuma categoria/subcategoria selecionada para associação.
                        </Typography>
                    )}
                </Box>
                <TextField
                    autoFocus
                    margin="dense"
                    id="tagTitle"
                    label="Título da Tag"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={newTagTitle}
                    onChange={(e) => setNewTagTitle(e.target.value)}
                    disabled={addingTag}
                    helperText={
                        newTagTitle.trim().length > 0 && newTagTitle.trim().length < 2
                            ? "Mínimo de 2 caracteres"
                            : ""
                    }
                    error={newTagTitle.trim().length > 0 && newTagTitle.trim().length < 2}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={addingTag}>
                    Cancelar
                </Button>
                <Button onClick={handleCreateTag} disabled={isCreateButtonDisabled}>
                    {addingTag ? <CircularProgress size={24} /> : 'Criar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminAddTagModal;
