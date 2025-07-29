// D:\meuscursos\frontend\src\pages\CoursesPage\CourseCreatePage\components\CourseCreationStepper\components\Step1BasicInfo.js

import React, { useState, useEffect } from 'react';
import {
  TextField,
  MenuItem,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  Button,
  FormHelperText,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
// client do Sanity e slugify não são necessários neste arquivo por enquanto, pois o upload de imagem e o slug automático estão comentados.
// import client from '../../../../../../sanity';
import { slugify } from '../../../../../../utils/slugify'; // Mantido para o slug, caso o usuário digite um título
import axios from 'axios';
import { useAuth } from '../../../../../../contexts/AuthContext'; // Importa useAuth para pegar o token

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const Step1BasicInfo = ({ formData, updateFormData, onShowAlert }) => {
  // Categorias e lógica de upload de imagem estão comentadas por enquanto.
  // const [categories, setCategories] = useState([]);
  // const [uploadingImage, setUploadingImage] = useState(false);
  // const [imageUploadError, setImageUploadError] = useState(null);

  const [aiModels, setAiModels] = useState([]);
  const [loadingAiModels, setLoadingAiModels] = useState(false);
  const [aiModelsError, setAiModelsError] = useState(null);

  const { userToken } = useAuth(); // Obtém o token do contexto de autenticação

  // Efeito para carregar categorias do Sanity (COMENTADO POR ENQUANTO)
  /*
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token'); // Ou userToken
        const response = await axios.get(`${API_BASE_URL}/api/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Erro ao buscar categorias do backend:", error);
        onShowAlert("Erro ao carregar categorias. Por favor, recarregue a página.", "error");
      }
    };

    fetchCategories();
  }, [onShowAlert]);
  */

  // Efeito para carregar modelos de IA disponíveis do backend (AGORA SEM LOOP)
  useEffect(() => {
    const fetchAiModels = async () => {
      if (!userToken) { // Só tenta buscar se houver um token
        setAiModelsError("Você precisa estar logado para carregar modelos de IA.");
        onShowAlert("Você precisa estar logado para carregar modelos de IA.", "warning");
        return;
      }

      setLoadingAiModels(true);
      setAiModelsError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ai-models`, {
          headers: {
            Authorization: `Bearer ${userToken}`, // Usa o token do useAuth
          },
        });
        const fetchedModels = response.data.models;
        setAiModels(fetchedModels);

        // Define o modelo padrão APENAS se nenhum estiver selecionado e houver modelos
        if (!formData.aiModelUsed && fetchedModels.length > 0) {
          const defaultModel = fetchedModels.find(m => m.default) || fetchedModels[0];
          if (defaultModel) {
            updateFormData(prevData => ({ ...prevData, aiModelUsed: defaultModel.id }));
          }
        }
      } catch (error) {
        console.error("Erro ao buscar modelos de IA:", error);
        // Verifica se o erro é 401 (Não Autorizado)
        if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
            setAiModelsError("Sessão expirada ou não autorizada. Faça login novamente.");
            onShowAlert("Sessão expirada ou não autorizada. Faça login novamente.", "error");
            // O redirecionamento para login já é tratado no CourseCreatePage/index.js
        } else {
            setAiModelsError("Não foi possível carregar os modelos de IA.");
            onShowAlert("Erro ao carregar modelos de IA. Verifique sua conexão.", "error");
        }
      } finally {
        setLoadingAiModels(false);
      }
    };

    fetchAiModels();
  }, [userToken, updateFormData, formData.aiModelUsed, onShowAlert]); // Adicionado userToken e formData.aiModelUsed como dependências para re-executar se o token aparecer ou se o modelo padrão mudar após o carregamento inicial

  const handleChange = (e) => {
    const { name, value, checked } = e.target; 

    if (name === 'title') {
      const newSlug = slugify(value);
      updateFormData({
        [name]: value,
        slug: { _type: 'slug', current: newSlug },
      });
    } else if (name === 'category') {
      // Lógica de categoria comentada por enquanto
      // updateFormData({
      //   [name]: { _ref: value, _type: 'reference' },
      // });
    } else if (name === 'isPro') {
      updateFormData({ [name]: checked });
    } else {
      updateFormData({ [name]: value });
    }
  };

  // Lida com o upload da imagem de capa (COMENTADO POR ENQUANTO)
  /*
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const assetDocument = await client.assets.upload('image', file, {
        filename: file.name,
      });

      updateFormData({
        mainImage: {
          asset: {
            _ref: assetDocument._id,
            _type: 'reference',
          },
        },
      });
      console.log("Imagem carregada com sucesso:", assetDocument);
      onShowAlert("Imagem carregada com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao carregar a imagem:", error);
      setImageUploadError("Erro ao carregar a imagem. Tente novamente.");
      onShowAlert("Erro ao carregar a imagem. Tente novamente.", "error");
    } finally {
      setUploadingImage(false);
    }
  };
  */

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Modelo de IA e Informações Básicas do Curso
      </Typography>

      <FormControl fullWidth required>
        <InputLabel id="ai-model-label">Modelo de IA para Geração de Conteúdo</InputLabel>
        <Select
          labelId="ai-model-label"
          id="ai-model-select"
          name="aiModelUsed"
          value={formData.aiModelUsed || ''}
          label="Modelo de IA para Geração de Conteúdo"
          onChange={handleChange}
          disabled={loadingAiModels || !userToken} // Desabilita se estiver carregando ou sem token
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

      <TextField
        label="Título do Curso"
        name="title"
        value={formData.title || ''}
        onChange={handleChange}
        fullWidth
        required
      />

      <TextField
        label="Slug do Curso (URL amigável)"
        name="slug.current"
        value={formData.slug.current || ''}
        onChange={(e) => updateFormData({ slug: { _type: 'slug', current: e.target.value } })}
        fullWidth
        helperText="Será gerado automaticamente, mas você pode editar."
      />

      <TextField
        label="Descrição Curta do Curso"
        name="description"
        value={formData.description || ''}
        onChange={handleChange}
        fullWidth
        multiline
        rows={4}
        required
      />

      {/* Campos de Categoria (COMENTADOS POR ENQUANTO) */}
      {/*
      <FormControl fullWidth required>
        <InputLabel id="category-label">Categoria</InputLabel>
        <Select
          labelId="category-label"
          id="category-select"
          name="category"
          value={formData.category._ref || ''}
          label="Categoria"
          onChange={handleChange}
        >
          {categories.map((cat) => (
            <MenuItem key={cat._id} value={cat._id}>
              {cat.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      */}

      <FormControl fullWidth required>
        <InputLabel id="level-label">Nível de Dificuldade</InputLabel>
        <Select
          labelId="level-label"
          id="level-select"
          name="level"
          value={formData.level || 'beginner'}
          label="Nível de Dificuldade"
          onChange={handleChange}
        >
          <MenuItem value="beginner">Iniciante</MenuItem>
          <MenuItem value="intermediate">Intermediário</MenuItem>
          <MenuItem value="advanced">Avançado</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Duração Estimada (em minutos)"
        name="estimatedDuration"
        type="number"
        value={formData.estimatedDuration || 0}
        onChange={handleChange}
        fullWidth
        required
        inputProps={{ min: 0 }}
        helperText="Ex: 120 para 2 horas"
      />

      <FormControl fullWidth required>
        <InputLabel id="language-label">Idioma do Curso</InputLabel>
        <Select
          labelId="language-label"
          id="language-select"
          name="language"
          value={formData.language || 'pt'}
          label="Idioma do Curso"
          onChange={handleChange}
        >
          <MenuItem value="pt">Português</MenuItem>
          <MenuItem value="en">Inglês</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Preço do Curso (BRL)"
        name="price"
        type="number"
        value={formData.price || 0}
        onChange={handleChange}
        fullWidth
        required
        inputProps={{ min: 0, step: "0.01" }}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={formData.isPro || false}
            onChange={handleChange}
            name="isPro"
          />
        }
        label="Conteúdo Pro? (Disponível apenas para membros Pro)"
      />

      {/* Seção de Imagem Principal (COMENTADA POR ENQUANTO) */}
      {/*
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Imagem Principal do Curso
        </Typography>
        <Button
          variant="contained"
          component="label"
          disabled={uploadingImage}
        >
          {uploadingImage ? <CircularProgress size={24} /> : 'Carregar Imagem'}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleImageUpload}
          />
        </Button>
        {imageUploadError && (
          <FormHelperText error>{imageUploadError}</FormHelperText>
        )}
        {formData.mainImage && formData.mainImage.asset && formData.mainImage.asset._ref && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Imagem carregada: {formData.mainImage.asset._ref.substring(0, 10)}...
          </Typography>
        )}
      </Box>
      */}

      <TextField
        label="Pré-requisitos (separados por vírgula)"
        name="prerequisites"
        value={(formData.prerequisites || []).join(', ')}
        onChange={(e) => updateFormData({ prerequisites: e.target.value.split(',').map(item => item.trim()) })}
        fullWidth
        helperText="Ex: Conhecimento básico de programação, Lógica de algoritmos"
      />
    </Box>
  );
};

export default Step1BasicInfo;
