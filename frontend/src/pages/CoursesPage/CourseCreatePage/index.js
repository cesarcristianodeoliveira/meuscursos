// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\index.js

import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Importa o componente principal do Stepper
import CourseCreationStepper from './components/CourseCreationStepper';
// Importa o modal de admin para limpeza de dados
import { AdminClearSanityDataModal } from './components';
import { useAuth } from '../../../contexts/AuthContext'; // Importa o hook useAuth

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function CourseCreatePage() {
  const [pageAlert, setPageAlert] = useState({ message: null, severity: null });
  const [openConfirmClearSanityModal, setOpenConfirmClearSanityModal] = useState(false);
  const [clearingSanityData, setClearingSanityData] = useState(false);

  const { userToken, user, logout } = useAuth();
  const isAdmin = user?.isAdmin || false;
  const navigate = useNavigate();

  // Efeito para verificar autenticação ao carregar a página
  useEffect(() => {
    if (!user) {
      // Se não houver usuário logado, redireciona para a página de login
      navigate('/entrar');
    }
  }, [user, navigate]); // Dependências: user e navigate

  const handleShowPageAlert = useCallback((message, severity) => {
    setPageAlert({ message, severity });
  }, []);

  const handleOpenClearSanityModal = useCallback(() => {
    setOpenConfirmClearSanityModal(true);
  }, []);

  const handleCloseClearSanityModal = useCallback(() => {
    setOpenConfirmClearSanityModal(false);
  }, []);

  const handleConfirmClearSanityData = useCallback(async () => {
    setClearingSanityData(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/clear-sanity-data`, {}, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      handleShowPageAlert(response.data.message || 'Dados do Sanity.io limpos com sucesso! Você será desconectado.', 'success');

      setTimeout(() => {
        logout();
        navigate('/entrar'); // Redireciona para a página de login após o logout
      }, 3000);

    } catch (error) {
      console.error('Erro ao limpar dados do Sanity.io:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Erro ao limpar dados do Sanity.io. Verifique o console para detalhes.';
      handleShowPageAlert(errorMessage, 'error');

      setTimeout(() => {
        logout();
        navigate('/entrar'); // Redireciona para a página de login mesmo em caso de erro
      }, 3000);
    } finally {
      setClearingSanityData(false);
      handleCloseClearSanityModal();
    }
  }, [userToken, handleShowPageAlert, handleCloseClearSanityModal, logout, navigate]);


  // Se o usuário não estiver logado, não renderiza nada até o redirecionamento
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Verificando autenticação...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Criar Novo Curso
      </Typography>

      {pageAlert.message && (
        <Alert severity={pageAlert.severity} sx={{ mb: 3 }}>
          {pageAlert.message}
        </Alert>
      )}

      <CourseCreationStepper onShowPageAlert={handleShowPageAlert} />

      {isAdmin && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleOpenClearSanityModal}
            disabled={clearingSanityData}
            sx={{ px: 4, py: 1.5 }}
          >
            {clearingSanityData ? <CircularProgress size={24} color="inherit" /> : 'Limpar Todos os Dados do Sanity.io (Admin)'}
          </Button>
        </Box>
      )}

      <AdminClearSanityDataModal
        open={openConfirmClearSanityModal}
        onClose={handleCloseClearSanityModal}
        onConfirm={handleConfirmClearSanityData}
        clearingData={clearingSanityData}
        onShowAlert={handleShowPageAlert}
      />
    </Container>
  );
}

export default CourseCreatePage;
