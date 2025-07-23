// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\AdminAddSubCategoryModal.js

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Typography
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function AdminAddSubCategoryModal({ open, onClose, isAuthenticated, userToken, onSubcategoryCreated, onShowAlert, parentCategory }) {
    const [newSubcategoryTitle, setNewSubcategoryTitle] = useState('');
    const [addingSubcategory, setAddingSubcategory] = useState(false);

    // Limpa o campo de título quando o modal é aberto ou a categoria pai muda
    useEffect(() => {
        if (open) {
            setNewSubcategoryTitle('');
        }
    }, [open, parentCategory]);

    // Condição para habilitar/desabilitar o botão "Criar"
    // Ele será desabilitado se estiver adicionando OU se o título (sem espaços) tiver menos de 3 caracteres
    const isCreateButtonDisabled = addingSubcategory || newSubcategoryTitle.trim().length < 3;

    const handleCreateSubcategory = async () => {
        if (!newSubcategoryTitle.trim()) {
            onShowAlert('O título da subcategoria não pode ser vazio.', 'warning');
            return;
        }
        if (!isAuthenticated) {
            onShowAlert('Você precisa estar logado para criar uma subcategoria.', 'error');
            return;
        }
        // Validação para garantir que uma categoria principal válida foi selecionada
        if (!parentCategory || !parentCategory._id || !parentCategory.name) { 
            onShowAlert('Nenhuma categoria principal válida selecionada para adicionar a subcategoria.', 'error');
            return;
        }

        setAddingSubcategory(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/subcategories`, 
                { 
                    title: newSubcategoryTitle.trim(),
                    parentCategoryId: parentCategory._id, 
                    parentCategoryName: parentCategory.name // Garante que o nome da categoria pai é enviado
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );
            const createdSubcategory = response.data; 

            onShowAlert(`Subcategoria "${createdSubcategory.name}" criada com sucesso para "${createdSubcategory.parentCategoryName}"!`, 'success');
            onSubcategoryCreated(createdSubcategory); 
            onClose(); 

        } catch (error) {
            console.error('Erro ao criar subcategoria:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || 'Erro ao criar subcategoria. Tente novamente.';
            onShowAlert(errorMessage, 'error');
        } finally {
            setAddingSubcategory(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Criar Nova Subcategoria</DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Para a categoria: <strong>{parentCategory ? parentCategory.name : 'Nenhuma selecionada'}</strong>
                </Typography>
                <TextField
                    autoFocus
                    margin="dense"
                    id="subcategoryTitle"
                    label="Título da Subcategoria"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={newSubcategoryTitle}
                    onChange={(e) => setNewSubcategoryTitle(e.target.value)}
                    disabled={addingSubcategory}
                    helperText={
                        newSubcategoryTitle.trim().length > 0 && newSubcategoryTitle.trim().length < 3
                            ? "Mínimo de 3 caracteres"
                            : ""
                    }
                    error={newSubcategoryTitle.trim().length > 0 && newSubcategoryTitle.trim().length < 3}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={addingSubcategory}>
                    Cancelar
                </Button>
                <Button onClick={handleCreateSubcategory} disabled={isCreateButtonDisabled}>
                    {addingSubcategory ? <CircularProgress size={24} /> : 'Criar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminAddSubCategoryModal;
