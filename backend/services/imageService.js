const axios = require('axios');
const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');

/**
 * Busca uma imagem no Pixabay e faz o upload para o Sanity Assets,
 * garantindo que a imagem seja inédita no sistema.
 */
const fetchAndUploadImage = async (query, pixabayCategory = 'education') => {
  try {
    // 1. Limpeza profunda da query
    // Removemos termos genéricos e pontuações que a IA possa ter enviado
    const cleanQuery = query
      .replace(/[:.;?!]/g, '') 
      .replace(/photography|photo|high quality|high definition|professional|course|lesson|education/gi, '')
      .trim()
      .split(' ')
      .slice(0, 3) // Focamos nos 3 primeiros termos para melhor precisão no Pixabay
      .join(' ');

    const category = (pixabayCategory || 'education').toLowerCase();
    
    // Buscamos 20 resultados para ter uma margem de escolha de imagens inéditas
    const pixabayUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&category=${category}&safesearch=true&per_page=20`;
    
    let response = await axios.get(pixabayUrl);
    let hits = response.data.hits || [];

    // 2. Fallback: Busca global se a categoria/query for restritiva demais
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
      // Verificamos no Sanity se esse ID do Pixabay já foi usado em algum curso
      const queryCheck = `count(*[_type == "course" && externalImageId == $id])`;
      const alreadyUsed = await client.fetch(queryCheck, { id: String(hit.id) });

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break; 
      }
    }

    // Fallback caso todas as 20 imagens da página já tenham sido usadas em outros cursos
    if (!selectedImage) {
      selectedImage = hits[Math.floor(Math.random() * hits.length)];
      console.log("⚠️ Usando imagem repetida (todas as opções da busca já foram usadas).");
    }

    // 4. Download da imagem com buffer
    const imageRes = await axios.get(selectedImage.largeImageURL, { 
      responseType: 'arraybuffer',
      timeout: 15000 
    });
    
    // 5. Upload para o Sanity Assets
    const asset = await client.assets.upload('image', Buffer.from(imageRes.data), {
      filename: `${formatSlug(cleanQuery)}-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: cleanQuery 
    });

    if (!asset || !asset._id) {
      throw new Error("Falha ao gerar Asset ID no Sanity");
    }

    console.log(`📸 Imagem [Pixabay ID: ${selectedImage.id}] vinculada ao Asset: ${asset._id}`);

    // Retornamos a estrutura pronta para o Controller salvar no Sanity
    return {
      assetId: asset._id,
      externalImageId: String(selectedImage.id)
    };

  } catch (error) {
    console.error("❌ Erro no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };