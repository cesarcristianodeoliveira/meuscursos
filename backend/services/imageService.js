const axios = require('axios');
const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');

/**
 * Busca uma imagem no Pixabay e faz o upload para o Sanity Assets.
 * Foca em termos visuais concretos para evitar imagens genéricas.
 */
const fetchAndUploadImage = async (query, pixabayCategory = '') => {
  try {
    if (!process.env.PIXABAY_API_KEY) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada no .env");
      return null;
    }

    // 1. Limpeza da Query: Focamos no que é VISUAL e em INGLÊS (melhor para Pixabay)
    const cleanQuery = (query || 'technology')
      .replace(/[:.;?!#]/g, '') 
      .replace(/photography|photo|high quality|professional|course|lesson|education|learning|study|online/gi, '')
      .trim()
      .split(' ')
      .slice(0, 3) 
      .join(' ');

    const validCategories = [
      'backgrounds', 'fashion', 'nature', 'science', 'education', 'feelings', 
      'health', 'people', 'religion', 'places', 'animals', 'industry', 
      'computer', 'food', 'sports', 'transportation', 'travel', 'buildings', 
      'business', 'music'
    ];
    
    const category = validCategories.includes(pixabayCategory.toLowerCase()) 
      ? pixabayCategory.toLowerCase() 
      : '';

    // 2. Construção da Requisição
    const baseUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}`;
    const params = `&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=20`;
    const categoryParam = category ? `&category=${category}` : '';
    
    let response = await axios.get(`${baseUrl}${params}${categoryParam}`, { timeout: 8000 });
    let hits = response.data.hits || [];

    // 3. Sistema de Fallbacks
    // Fallback 1: Se com categoria não deu nada, tenta busca global
    if (hits.length === 0 && category) {
      console.log(`🔍 Fallback 1: Buscando "${cleanQuery}" sem restrição de categoria.`);
      const fallbackRes = await axios.get(`${baseUrl}${params}`);
      hits = fallbackRes.data.hits || [];
    }

    // Fallback 2: Se ainda nada, tenta a categoria pura (ex: "industry") ou termo genérico
    if (hits.length === 0) {
      const fallbackTerm = category || 'technology';
      console.log(`🔍 Fallback 2: Buscando pelo termo de segurança "${fallbackTerm}".`);
      const catRes = await axios.get(`${baseUrl}&q=${encodeURIComponent(fallbackTerm)}&image_type=photo&per_page=10`);
      hits = catRes.data.hits || [];
    }

    if (!hits || hits.length === 0) {
      console.log(`⚠️ Nenhuma imagem encontrada no Pixabay.`);
      return null; 
    }

    // 4. Verificação de Ineditismo (Deduplicação)
    let selectedImage = null;
    for (const hit of hits) {
      // Verifica se o ID desta imagem já existe no seu banco Sanity
      const queryCheck = `count(*[_type == "course" && externalImageId == $id])`;
      const alreadyUsed = await client.fetch(queryCheck, { id: String(hit.id) });

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break; 
      }
    }

    // Se todas forem repetidas, pega a primeira (melhor ter imagem repetida que nenhuma)
    selectedImage = selectedImage || hits[0];

    // 5. Download e Upload para o Sanity Assets
    console.log(`📥 Baixando imagem de: ${selectedImage.largeImageURL}`);
    
    const imageRes = await axios.get(selectedImage.largeImageURL, { 
      responseType: 'arraybuffer',
      timeout: 15000 
    });
    
    const buffer = Buffer.from(imageRes.data);
    const fileName = `${formatSlug(cleanQuery)}-${selectedImage.id}.jpg`;

    const asset = await client.assets.upload('image', buffer, {
      filename: fileName,
      contentType: 'image/jpeg',
      label: cleanQuery 
    });

    console.log(`📸 Imagem carregada com sucesso! (ID Sanity: ${asset._id})`);

    return {
      assetId: asset._id,
      externalImageId: String(selectedImage.id)
    };

  } catch (error) {
    console.error("❌ Erro Crítico no ImageService:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };