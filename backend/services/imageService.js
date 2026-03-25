const axios = require('axios');
const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');

const fetchAndUploadImage = async (query, pixabayCategory = 'education') => {
  try {
    // 1. Limpeza da query para melhorar a busca na API
    const cleanQuery = query
      .replace(/photography|photo|high quality|high definition|professional/gi, '')
      .trim();

    // 2. Montagem da URL com fallback de categoria
    const category = (pixabayCategory || 'education').toLowerCase();
    const pixabayUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&category=${category}&safesearch=true&per_page=10`;
    
    let response = await axios.get(pixabayUrl);
    let hits = response.data.hits;

    // 3. Fallback: Busca global se a categoria falhar
    if (!hits || hits.length === 0) {
      const fallbackUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&safesearch=true&per_page=5`;
      const fallbackRes = await axios.get(fallbackUrl);
      hits = fallbackRes.data.hits;
    }

    // 4. Processamento e Upload
    if (hits && hits.length > 0) {
      const selectedImage = hits[Math.floor(Math.random() * Math.min(hits.length, 5))];
      
      const imageRes = await axios.get(selectedImage.largeImageURL, { responseType: 'arraybuffer' });
      
      // Upload para o Sanity Assets - Retorna o objeto do Asset com o _id
      const asset = await client.assets.upload('image', Buffer.from(imageRes.data), {
        filename: `${formatSlug(cleanQuery)}-${Date.now()}.jpg`
      });

      console.log("📸 Imagem carregada no Sanity. Asset ID:", asset._id);
      return asset; 
    }

    return null;
  } catch (error) {
    console.error("❌ Erro crítico no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };