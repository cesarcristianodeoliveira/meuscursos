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
import axios from 'axios';

// Este componente é responsável por criar uma nova categoria
// e notificar o componente pai sobre o sucesso/falha
function AdminAddCategoryModal({ open, onClose, isAuthenticated, userToken, onCategoryCreated, onShowAlert }) {
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

    // Condição para habilitar/desabilitar o botão "Criar"
    // Ele será desabilitado se estiver adicionando OU se o título (sem espaços) tiver menos de 3 caracteres
    const isCreateButtonDisabled = addingCategory || newCategoryTitle.trim().length < 3;

    const handleCreateCategory = async () => {
        // A validação de campo vazio (newCategoryTitle.trim() === '') já está coberta
        // pela condição isCreateButtonDisabled (pois 0 < 3), mas mantemos o onShowAlert explícito.
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
                    // Adiciona helperText e error para feedback visual ao usuário
                    helperText={
                        newCategoryTitle.trim().length > 0 && newCategoryTitle.trim().length < 3
                            ? "Mínimo de 3 caracteres"
                            : ""
                    }
                    error={newCategoryTitle.trim().length > 0 && newCategoryTitle.trim().length < 3}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={addingCategory}>
                    Cancelar
                </Button>
                {/* O botão "Criar" agora usa a nova condição de desabilitação */}
                <Button onClick={handleCreateCategory} disabled={isCreateButtonDisabled}>
                    {addingCategory ? <CircularProgress size={24} /> : 'Criar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminAddCategoryModal;
