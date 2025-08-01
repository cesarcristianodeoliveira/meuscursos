// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\CourseCreationStepper\components\Step1AIModelSelection.js

import React, { useState, useEffect } from 'react';
import {
  MenuItem,
  Box,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../../../../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const Step1AIModelSelection = ({ formData, updateFormData, onShowAlert, setLoadingProgress }) => {
  const [aiModels, setAiModels] = useState([]);
  const [aiModelsError, setAiModelsError] = useState(null);

  const { userToken } = useAuth();

  useEffect(() => {
    const fetchAiModels = async () => {
      if (!userToken) {
        setAiModelsError("Você precisa estar logado para carregar modelos de IA.");
        onShowAlert("Você precisa estar logado para carregar modelos de IA.", "warning");
        return;
      }

      setLoadingProgress(true);
      setAiModelsError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ai-models`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        const fetchedModels = response.data.models;
        setAiModels(fetchedModels);

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
        setLoadingProgress(false);
      }
    };

    // A busca só acontece se a lista de modelos estiver vazia.
    // Isso garante que a API não será chamada novamente ao voltar para este passo.
    if (aiModels.length === 0) {
      fetchAiModels();
    }
  }, [userToken, updateFormData, formData.aiModelUsed, onShowAlert, setLoadingProgress, aiModels.length]);

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
        width: '100%',
      }}
    >
      <FormControl fullWidth required sx={{ maxWidth: 400 }}>
        <InputLabel id="ai-model-label">Modelo de IA para Geração de Conteúdo</InputLabel>
        <Select
          labelId="ai-model-label"
          id="ai-model-select"
          name="aiModelUsed"
          value={aiModels.some(model => model.id === formData.aiModelUsed) ? formData.aiModelUsed : ''}
          label="Modelo de IA para Geração de Conteúdo"
          onChange={handleChange}
          disabled={!userToken}
          sx={{ '& .MuiSelect-select': { width: '100%', py: 1.5, fontSize: '1.1rem' } }}
        >
          {aiModelsError ? (
            <MenuItem disabled>{aiModelsError}</MenuItem>
          ) : (
            aiModels.length === 0 ? (
              <MenuItem disabled>
                Carregando modelos...
              </MenuItem>
            ) : (
              aiModels.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </MenuItem>
              ))
            )
          )}
        </Select>
        {aiModelsError && <FormHelperText error>{aiModelsError}</FormHelperText>}
        {!userToken && <FormHelperText error>Faça login para selecionar um modelo de IA.</FormHelperText>}
      </FormControl>
    </Box>
  );
};

export default Step1AIModelSelection;
