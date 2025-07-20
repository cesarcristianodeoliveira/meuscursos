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

    const handleCreateSubcategory = async () => {
        if (!newSubcategoryTitle.trim()) {
            onShowAlert('O título da subcategoria não pode ser vazio.', 'warning');
            return;
        }
        if (!isAuthenticated) {
            onShowAlert('Você precisa estar logado para criar uma subcategoria.', 'error');
            return;
        }
        if (!parentCategory || !parentCategory._id) {
            onShowAlert('Nenhuma categoria principal selecionada para adicionar a subcategoria.', 'error');
            return;
        }

        setAddingSubcategory(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/subcategories`, 
                { 
                    title: newSubcategoryTitle.trim(),
                    parentCategoryId: parentCategory._id // Envia o ID da categoria pai
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );
            const createdSubcategory = response.data; // Assumindo que o backend retorna a subcategoria criada

            onShowAlert(`Subcategoria "${createdSubcategory.name}" criada com sucesso para "${createdSubcategory.parentCategoryName}"!`, 'success');
            onSubcategoryCreated(createdSubcategory); // Notifica o pai com a subcategoria criada
            onClose(); // Fecha o modal

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
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={addingSubcategory}>
                    Cancelar
                </Button>
                <Button onClick={handleCreateSubcategory} disabled={addingSubcategory}>
                    {addingSubcategory ? <CircularProgress size={24} /> : 'Criar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminAddSubCategoryModal;
