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
import client from '../../../../../../sanity';
import { slugify } from '../../../../../../utils/slugify';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const Step1BasicInfo = ({ formData, updateFormData, onShowAlert }) => {
  const [categories, setCategories] = useState([]);
  const [aiModels, setAiModels] = useState([]);
  const [loadingAiModels, setLoadingAiModels] = useState(false);
  const [aiModelsError, setAiModelsError] = useState(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const query = `*[_type == "courseCategory"]{_id, title}`;
        const fetchedCategories = await client.fetch(query);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Erro ao buscar categorias do Sanity:", error);
        onShowAlert("Erro ao carregar categorias. Por favor, recarregue a página.", "error");
      }
    };

    fetchCategories();
  }, [onShowAlert]);

  useEffect(() => {
    const fetchAiModels = async () => {
      setLoadingAiModels(true);
      setAiModelsError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/ai-models`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAiModels(response.data.models);
        if (!formData.aiModelUsed && response.data.models.length > 0) {
          const defaultModel = response.data.models.find(m => m.default) || response.data.models[0];
          updateFormData({ aiModelUsed: defaultModel.id });
        }
      } catch (error) {
        console.error("Erro ao buscar modelos de IA:", error);
        setAiModelsError("Não foi possível carregar os modelos de IA.");
        onShowAlert("Erro ao carregar modelos de IA. Verifique sua conexão.", "error");
      } finally {
        setLoadingAiModels(false);
      }
    };

    fetchAiModels();
  }, [formData.aiModelUsed, updateFormData, onShowAlert]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'title') {
      const newSlug = slugify(value);
      updateFormData({
        [name]: value,
        slug: { _type: 'slug', current: newSlug },
      });
    } else if (name === 'category') {
      updateFormData({
        [name]: { _ref: value, _type: 'reference' },
      });
    } else if (name === 'isPro') {
      updateFormData({ [name]: checked });
    } else {
      updateFormData({ [name]: value });
    }
  };

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
          disabled={loadingAiModels}
        >
          {loadingAiModels ? (
            <MenuItem disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} /> Carregando modelos...
            </MenuItem>
          ) : aiModelsError ? (
            <MenuItem disabled>Erro ao carregar modelos.</MenuItem>
          ) : (
            aiModels.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </MenuItem>
            ))
          )}
        </Select>
        {aiModelsError && <FormHelperText error>{aiModelsError}</FormHelperText>}
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

      <TextField
        label="Pré-requisitos (separados por vírgula)"
        name="prerequisites"
        // Correção: Garante que formData.prerequisites seja um array antes de chamar .join()
        value={(formData.prerequisites || []).join(', ')}
        onChange={(e) => updateFormData({ prerequisites: e.target.value.split(',').map(item => item.trim()) })}
        fullWidth
        helperText="Ex: Conhecimento básico de programação, Lógica de algoritmos"
      />
    </Box>
  );
};

export default Step1BasicInfo;
