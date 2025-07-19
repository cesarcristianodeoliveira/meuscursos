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
// axios REMOVIDO: Não é usado na simulação atual

// Este componente será responsável por criar uma nova categoria
// e notificar o componente pai sobre o sucesso/falha
function AdminAddCategoryModal({ open, onClose, isAuthenticated, userToken, onCategoryCreated, onShowAlert }) {
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);

    const handleCreateCategory = async () => {
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
            // FUTURO: Aqui você faria a chamada real para o seu backend para salvar no Sanity
            // Exemplo de como seria a chamada real (você precisaria criar esta rota no backend):
            /*
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/categories`, 
                { title: newCategoryTitle }, // Envia o título da nova categoria
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            const createdCategory = response.data; // Assumindo que o backend retorna a categoria criada
            */

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simula API call
            const createdCategory = { _id: `temp-${Date.now()}`, name: newCategoryTitle }; // Simula categoria criada

            onShowAlert(`Categoria "${newCategoryTitle}" criada com sucesso!`, 'success');
            onCategoryCreated(createdCategory); // Notifica o pai com a categoria criada
            onClose(); // Fecha o modal

        } catch (error) {
            console.error('Erro ao criar categoria:', error);
            onShowAlert('Erro ao criar categoria. Tente novamente.', 'error');
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
