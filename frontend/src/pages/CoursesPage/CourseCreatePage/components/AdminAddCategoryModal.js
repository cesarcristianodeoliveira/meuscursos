// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\AdminAddCategoryModal.js
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress
} from '@mui/material';
import axios from 'axios'; // AGORA AXIOS É USADO!

// Este componente será responsável por criar uma nova categoria
// e notificar o componente pai sobre o sucesso/falha
function AdminAddCategoryModal({ open, onClose, isAuthenticated, userToken, onCategoryCreated, onShowAlert }) {
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

    const handleCreateCategory = async () => {
        // Validação de campo vazio no frontend
        if (!newCategoryTitle.trim()) {
            onShowAlert('O título da categoria não pode ser vazio.', 'warning');
            return;
        }
        if (!isAuthenticated) {
            onShowAlert('Você precisa estar logado para criar uma categoria.', 'error');
            return;
        }

        setAddingCategory(true);
        try {
            // CHAMADA REAL PARA O BACKEND
            const response = await axios.post(`${API_BASE_URL}/api/categories`, 
                { title: newCategoryTitle.trim() }, // Envia o título da nova categoria
                { 
                    headers: { 
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json' // Garante que o tipo de conteúdo é JSON
                    } 
                }
            );
            const createdCategory = response.data; // Assumindo que o backend retorna a categoria criada {_id, name}

            onShowAlert(`Categoria "${createdCategory.name}" criada com sucesso!`, 'success');
            onCategoryCreated(createdCategory); // Notifica o pai com a categoria criada
            onClose(); // Fecha o modal

        } catch (error) {
            console.error('Erro ao criar categoria:', error.response?.data || error.message);
            // Captura a mensagem de erro do backend (ex: "Esta categoria já existe.")
            const errorMessage = error.response?.data?.message || 'Erro ao criar categoria. Tente novamente.';
            onShowAlert(errorMessage, 'error');
        } finally {
            setAddingCategory(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Criar Nova Categoria</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="categoryTitle"
                    label="Título da Categoria"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={newCategoryTitle}
                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                    disabled={addingCategory}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={addingCategory}>
                    Cancelar
                </Button>
                <Button onClick={handleCreateCategory} disabled={addingCategory}>
                    {addingCategory ? <CircularProgress size={24} /> : 'Criar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminAddCategoryModal;
