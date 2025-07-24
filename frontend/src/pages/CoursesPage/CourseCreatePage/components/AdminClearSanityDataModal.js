// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\AdminClearSanityDataModal.js

import React from 'react'; // 'useState' e 'useEffect' não são mais necessários aqui
// 'axios' e 'useAuth' não são mais necessários aqui, pois a lógica foi movida para o pai
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    CircularProgress,
    Box
} from '@mui/material';

/**
 * Componente de Modal para Confirmar e Executar a Limpeza de Dados do Sanity.io.
 * Este modal é exibido quando um administrador deseja limpar categorias, subcategorias,
 * tags e cursos do Sanity.io. Ele requer confirmação antes de prosseguir.
 *
 * @param {object} props - As propriedades do componente.
 * @param {boolean} props.open - Estado booleano que controla a visibilidade do modal.
 * @param {function} props.onClose - Função de callback para fechar o modal.
 * @param {function} props.onConfirm - Função de callback para ser executada quando a limpeza é confirmada.
 * @param {boolean} props.clearingData - Estado booleano que indica se a limpeza de dados está em andamento.
 * @param {function} props.onShowAlert - Função de callback para exibir alertas (Snackbar).
 */
function AdminClearSanityDataModal({ open, onClose, onConfirm, clearingData, onShowAlert }) {
    // Não é necessário estado local para loading/error/success aqui,
    // pois o componente pai (CourseCreatePage) gerenciará isso e passará via props.

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{"Confirmar Limpeza de Dados do Sanity.io?"}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    <Box component="span" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        ATENÇÃO:
                    </Box> Esta ação irá DELETAR PERMANENTEMENTE TODOS os documentos de categorias, subcategorias, tags e cursos no Sanity.io. Esta ação não pode ser desfeita.
                    <br/><br/>
                    Tem certeza que deseja continuar?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={clearingData}>
                    Cancelar
                </Button>
                <Button 
                    onClick={onConfirm} // Chama a função onConfirm passada pelo pai
                    color="error" 
                    variant="contained" 
                    disabled={clearingData}
                    startIcon={clearingData ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {clearingData ? 'Limpando...' : 'Limpar Tudo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminClearSanityDataModal;
