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
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function AdminAddTagModal({ open, onClose, isAuthenticated, userToken, onTagCreated, onShowAlert }) {
    const [newTagTitle, setNewTagTitle] = useState('');
    const [addingTag, setAddingTag] = useState(false);

    // Limpa o campo de título quando o modal é aberto
    useEffect(() => {
        if (open) {
            setNewTagTitle('');
        }
    }, [open]);

    // Condição para habilitar/desabilitar o botão "Criar"
    const isCreateButtonDisabled = addingTag || newTagTitle.trim().length < 3;

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
            const response = await axios.post(`${API_BASE_URL}/api/tags`, 
                { title: newTagTitle.trim() },
                { 
                    headers: { 
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );
            const createdTag = response.data; // Assumindo que o backend retorna a tag criada

            onShowAlert(`Tag "${createdTag.name}" criada com sucesso!`, 'success');
            onTagCreated(createdTag); // Notifica o pai com a tag criada
            onClose(); // Fecha o modal

        } catch (error) {
            console.error('Erro ao criar tag:', error.response?.data || error.message);
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
                    helperText={newTagTitle.trim().length < 3 && newTagTitle.trim().length > 0 ? "Mínimo de 3 caracteres" : ""}
                    error={newTagTitle.trim().length < 3 && newTagTitle.trim().length > 0}
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
