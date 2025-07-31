// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\CourseCreationStepper\components\Step1AIModelSelection.js

import React, { useState, useEffect } from 'react';
import {
  MenuItem,
  Box,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  // LinearProgress, // Removido
} from '@mui/material';
// import LinearProgress from '@mui/material/LinearProgress'; // Removido
import CircularProgress from '@mui/material/CircularProgress'; // Mantido para o MenuItem desabilitado
import axios from 'axios';
import { useAuth } from '../../../../../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Recebe setLoadingStepSpecific via props
const Step1AIModelSelection = ({ formData, updateFormData, onShowAlert, setLoadingStepSpecific }) => {
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

      setLoadingStepSpecific(true); // Ativa o loading no componente pai
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
        setLoadingStepSpecific(false); // Desativa o loading no componente pai
      }
    };

    fetchAiModels();
  }, [userToken, updateFormData, formData.aiModelUsed, onShowAlert, setLoadingStepSpecific]); // Adiciona setLoadingStepSpecific como dependência

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
        // position: 'relative', // Não é mais necessário aqui
      }}
    >
      {/* LinearProgress foi movido para o componente pai (CourseCreationStepper) */}

      <FormControl fullWidth required sx={{ maxWidth: 400 }}>
        <InputLabel id="ai-model-label">Modelo de IA para Geração de Conteúdo</InputLabel>
        <Select
          labelId="ai-model-label"
          id="ai-model-select"
          name="aiModelUsed"
          value={aiModels.some(model => model.id === formData.aiModelUsed) ? formData.aiModelUsed : ''}
          label="Modelo de IA para Geração de Conteúdo"
          onChange={handleChange}
          disabled={!userToken} // Desabilita apenas se não houver token, o loading é controlado pelo pai
          sx={{ '& .MuiSelect-select': { width: '100%', py: 1.5, fontSize: '1.1rem' } }} 
        >
          {/* O CircularProgress dentro do MenuItem é para quando a lista de modelos está vazia ou com erro */}
          {aiModelsError ? (
            <MenuItem disabled>{aiModelsError}</MenuItem>
          ) : (
            aiModels.length === 0 ? ( // Adicionado para exibir "Carregando modelos..." enquanto a lista está vazia
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Carregando modelos...
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
