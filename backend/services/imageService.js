const axios = require('axios');
const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');

/**
 * Busca uma imagem no Pixabay e faz o upload para o Sanity Assets,
 * garantindo que a imagem seja inédita no sistema.
 */
const fetchAndUploadImage = async (query, pixabayCategory = 'education') => {
  try {
    // 1. Limpeza profunda da query (evita palavras que "poluem" a busca técnica)
    const cleanQuery = query
      .replace(/photography|photo|high quality|high definition|professional|course|lesson|education/gi, '')
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

    if (!hits || hits.length === 0) {
      console.log(`⚠️ Nenhuma imagem encontrada para: ${cleanQuery}`);
      return null;
    }

    // 3. Lógica de Ineditismo (Deduplicação)
    let selectedImage = null;

    for (const hit of hits) {
      // Verificamos se o ID do Pixabay já existe no Sanity
      const queryCheck = `count(*[externalImageId == $id || modules[].externalImageId == $id])`;
      const alreadyUsed = await client.fetch(queryCheck, { id: String(hit.id) });

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break; 
      }
    }

    // Fallback caso todas as imagens já tenham sido usadas
    if (!selectedImage) {
      selectedImage = hits[Math.floor(Math.random() * hits.length)];
      console.log("⚠️ Usando imagem repetida como fallback.");
    }

    // 4. Download da imagem
    const imageRes = await axios.get(selectedImage.largeImageURL, { 
      responseType: 'arraybuffer',
      timeout: 15000 // Timeout para evitar que o serviço trave
    });
    
    // 5. Upload para o Sanity Assets
    // Usamos o prefixo 'image-' para garantir que o Sanity trate como asset de imagem
    const asset = await client.assets.upload('image', Buffer.from(imageRes.data), {
      filename: `${formatSlug(cleanQuery)}-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: cleanQuery // Ajuda na busca interna do Sanity Studio
    });

    if (!asset || !asset._id) {
      throw new Error("Falha ao gerar Asset ID no Sanity");
    }

    console.log(`📸 Imagem [Pixabay ID: ${selectedImage.id}] vinculada ao Asset: ${asset._id}`);

    // Retornamos um objeto limpo para o Controller
    return {
      asset: {
        _id: asset._id,
        _type: 'reference'
      },
      externalId: String(selectedImage.id)
    };

  } catch (error) {
    console.error("❌ Erro no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };