const axios = require('axios');
const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');

/**
 * Busca uma imagem no Pixabay e faz o upload para o Sanity Assets,
 * garantindo que a imagem seja inédita no sistema.
 */
const fetchAndUploadImage = async (query, pixabayCategory = 'education') => {
  try {
    // 1. Limpeza da query
    const cleanQuery = query
      .replace(/photography|photo|high quality|high definition|professional/gi, '')
      .trim();

    const category = (pixabayCategory || 'education').toLowerCase();
    
    // Buscamos 20 resultados para ter uma margem de escolha de imagens inéditas
    const pixabayUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&category=${category}&safesearch=true&per_page=20`;
    
    let response = await axios.get(pixabayUrl);
    let hits = response.data.hits || [];

    // 2. Fallback: Busca global se a categoria for restritiva demais
    if (hits.length === 0) {
      const fallbackUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&safesearch=true&per_page=10`;
      const fallbackRes = await axios.get(fallbackUrl);
      hits = fallbackRes.data.hits || [];
    }

    if (hits.length === 0) return null;

    // 3. Lógica de Ineditismo (Deduplicação)
    let selectedImage = null;

    for (const hit of hits) {
      // Verifica se o ID do Pixabay já existe no campo externalImageId do Sanity
      // Verificamos tanto na capa quanto dentro dos módulos
      const queryCheck = `count(*[externalImageId == $id || modules[].externalImageId == $id])`;
      const alreadyUsed = await client.fetch(queryCheck, { id: String(hit.id) });

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break; // Encontramos uma imagem nunca usada!
      }
    }

    // Se todas as imagens da primeira página já foram usadas, pegamos a primeira do array como último recurso
    if (!selectedImage) {
      selectedImage = hits[0];
      console.log("⚠️ Nenhuma imagem inédita encontrada na página. Usando repetida como fallback.");
    }

    // 4. Download e Upload para o Sanity
    const imageRes = await axios.get(selectedImage.largeImageURL, { responseType: 'arraybuffer' });
    
    const asset = await client.assets.upload('image', Buffer.from(imageRes.data), {
      filename: `${formatSlug(cleanQuery)}-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg'
    });

    console.log(`📸 Imagem [ID: ${selectedImage.id}] carregada com sucesso.`);

    // Retornamos o asset E o ID externo para o Controller salvar no documento
    return {
      asset: asset,
      externalId: String(selectedImage.id)
    };

  } catch (error) {
    console.error("❌ Erro no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };