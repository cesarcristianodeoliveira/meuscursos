// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\CourseCreationStepper\components\Step1AIModelSelection.js

import React, { useState, useEffect } from 'react';
import {
  MenuItem,
  Box,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../../../../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const Step1AIModelSelection = ({ formData, updateFormData, onShowAlert }) => {
  const [aiModels, setAiModels] = useState([]);
  const [loadingAiModels, setLoadingAiModels] = useState(false);
  const [aiModelsError, setAiModelsError] = useState(null);

  const { userToken } = useAuth();

  useEffect(() => {
    const fetchAiModels = async () => {
      if (!userToken) {
        setAiModelsError("Você precisa estar logado para carregar modelos de IA.");
        onShowAlert("Você precisa estar logado para carregar modelos de IA.", "warning");
        return;
      }

      setLoadingAiModels(true);
      setAiModelsError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ai-models`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        const fetchedModels = response.data.models;
        setAiModels(fetchedModels);

        // Define o modelo padrão APENAS se nenhum estiver selecionado NO FORM DATA
        // E se houver modelos disponíveis.
        if (!formData.aiModelUsed && fetchedModels.length > 0) {
          const defaultModel = fetchedModels.find(m => m.default) || fetchedModels[0];
          if (defaultModel) {
            updateFormData(prevData => ({ ...prevData, aiModelUsed: defaultModel.id }));
          }
        }
      } catch (error) {
        console.error("Erro ao buscar modelos de IA:", error);
        if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
            setAiModelsError("Sessão expirada ou não autorizada. Faça login novamente.");
            onShowAlert("Sessão expirada ou não autorizada. Faça login novamente.", "error");
        } else {
            setAiModelsError("Não foi possível carregar os modelos de IA.");
            onShowAlert("Erro ao carregar modelos de IA. Verifique sua conexão.", "error");
        }
      } finally {
        setLoadingAiModels(false);
      }
    };

    fetchAiModels();
  }, [userToken, updateFormData, formData.aiModelUsed, onShowAlert]);

  const handleChange = (e) => {
    const { name, value } = e.target; 
    updateFormData({ [name]: value });
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2, 
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      <FormControl fullWidth required sx={{ maxWidth: 400 }}>
        <InputLabel id="ai-model-label">Modelo de IA para Geração de Conteúdo</InputLabel>
        <Select
          labelId="ai-model-label"
          id="ai-model-select"
          name="aiModelUsed"
          // AQUI ESTÁ A MUDANÇA: Verifica se o valor do formData existe nas opções disponíveis
          value={aiModels.some(model => model.id === formData.aiModelUsed) ? formData.aiModelUsed : ''}
          label="Modelo de IA para Geração de Conteúdo"
          onChange={handleChange}
          disabled={loadingAiModels || !userToken}
          sx={{ '& .MuiSelect-select': { width: '100%', py: 1.5, fontSize: '1.1rem' } }} 
        >
          {loadingAiModels ? (
            <MenuItem disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} /> Carregando modelos...
            </MenuItem>
          ) : aiModelsError ? (
            <MenuItem disabled>{aiModelsError}</MenuItem>
          ) : (
            aiModels.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </MenuItem>
            ))
          )}
        </Select>
        {aiModelsError && <FormHelperText error>{aiModelsError}</FormHelperText>}
        {!userToken && <FormHelperText error>Faça login para selecionar um modelo de IA.</FormHelperText>}
      </FormControl>
    </Box>
  );
};

export default Step1AIModelSelection;
