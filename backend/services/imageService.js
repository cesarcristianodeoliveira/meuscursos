const axios = require('axios');
const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');

const fetchAndUploadImage = async (query, pixabayCategory) => {
  try {
    // 1. Limpeza da query: removemos termos que a IA possa ter colocado e que poluem a busca da API
    const cleanQuery = query
      .replace(/photography|photo|high quality|high definition|professional/gi, '')
      .trim();

    // 2. Montagem da URL: Priorizamos a categoria oficial enviada pela IA
    // Usamos per_page=10 para ter uma amostragem melhor para o sorteio aleatório
    const pixabayUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&category=${pixabayCategory.toLowerCase()}&safesearch=true&per_page=10`;
    
    let response = await axios.get(pixabayUrl);
    let hits = response.data.hits;

    // 3. Fallback: Se não houver resultados com a categoria, tentamos uma busca global apenas pela query
    if (!hits || hits.length === 0) {
      const fallbackUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&safesearch=true&per_page=5`;
      const fallbackRes = await axios.get(fallbackUrl);
      hits = fallbackRes.data.hits;
    }

    // 4. Processamento da Imagem
    if (hits && hits.length > 0) {
      // Sorteamos entre os primeiros resultados para garantir variedade visual em temas repetidos
      const selectedImage = hits[Math.floor(Math.random() * Math.min(hits.length, 5))];
      
      const imageRes = await axios.get(selectedImage.largeImageURL, { responseType: 'arraybuffer' });
      
      // Upload para o Sanity Assets
      const asset = await client.assets.upload('image', Buffer.from(imageRes.data), {
        filename: `${formatSlug(cleanQuery)}-${Date.now()}.jpg`
      });

      return { 
        _type: 'image', 
        asset: { _ref: asset._id, _type: 'reference' } 
      };
    }

    // Se absolutamente nada for encontrado, retornamos null
    return null;

  } catch (error) {
    console.error("Erro crítico no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };