const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.4
 * Prioriza o prompt visual da IA e garante compatibilidade com o Sanity Assets.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada. O curso será criado sem capa.");
      return null;
    }

    // 1. Refino da Query: Prioridade máxima para o prompt visual da IA (imageSearchPrompt)
    // Se a IA não gerou, usamos categoria + título como fallback
    let cleanQuery = "";
    
    if (courseData.imageSearchPrompt) {
      // Limpa termos técnicos que o Pixabay não entende bem
      cleanQuery = courseData.imageSearchPrompt
        .replace(/photographic|minimalist|professional|highly/gi, '')
        .trim();
    } else {
      const forbiddenTerms = /curso|aula|online|educação|aprendizado|estudo|dicas|course|lesson|education|learning/gi;
      cleanQuery = `${courseData.categoryName || ''} ${courseData.title || ''}`
        .replace(forbiddenTerms, '')
        .replace(/[:.;?!#]/g, '')
        .trim();
    }

    // Limitamos a 4 palavras para não confundir o motor de busca do Pixabay
    const finalQuery = cleanQuery.split(/\s+/).slice(0, 4).join(' ');

    console.log(`📸 Buscando imagem no Pixabay para: "${finalQuery}"`);

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    // Usamos lang=en pois o prompt da IA agora vem em inglês (melhor precisão)
    const searchParams = `&q=${encodeURIComponent(finalQuery)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=10&lang=en`;

    // 2. Execução da Busca Principal
    let response = await axios.get(baseUrl + searchParams, { timeout: 8000 });
    let hits = response.data.hits || [];

    // 3. Fallback: Se não achou nada com o prompt da IA, tenta a Categoria em Português
    if (hits.length === 0) {
      console.log(`⚠️ Sem resultados para o prompt específico. Tentando categoria...`);
      const fallbackTerm = courseData.categoryName || 'tecnologia';
      const fallbackUrl = `${baseUrl}&q=${encodeURIComponent(fallbackTerm)}&image_type=photo&orientation=horizontal&per_page=5&lang=pt`;
      const fallbackRes = await axios.get(fallbackUrl);
      hits = fallbackRes.data.hits || [];
    }

    if (hits.length === 0) return null;

    // 4. Verificação de Ineditismo (Deduplicação)
    let selectedImage = null;
    for (const hit of hits) {
      const alreadyUsed = await client.fetch(
        `count(*[_type == "course" && externalImageId == $id])`, 
        { id: String(hit.id) }
      );

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break;
      }
    }

    selectedImage = selectedImage || hits[0];

    // 5. Download e Upload
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
    const buffer = Buffer.from(imageRes.data);

    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa: ${courseData.title}`
    });

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