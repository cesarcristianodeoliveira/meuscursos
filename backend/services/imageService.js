const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.5
 * Melhora drasticamente a precisão da busca removendo stop-words e termos técnicos.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada.");
      return null;
    }

    let cleanQuery = "";
    
    // 1. Refino Inteligente da Query
    if (courseData.imageSearchPrompt) {
      // Remove adjetivos genéricos e conectivos para focar no substantivo
      cleanQuery = courseData.imageSearchPrompt
        .replace(/photographic|minimalist|professional|highly|a|of|the|with|on|an|single|serving/gi, '')
        .replace(/[,.;]/g, '')
        .trim();
    } else {
      const forbiddenTerms = /curso|aula|online|educação|aprendizado|estudo|dicas|course|lesson|education|learning/gi;
      cleanQuery = `${courseData.categoryName || ''} ${courseData.title || ''}`
        .replace(forbiddenTerms, '')
        .replace(/[:.;?!#]/g, '')
        .trim();
    }

    // Pega as palavras que sobraram (que agora são os substantivos reais)
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    // Usamos as 3 palavras mais importantes (geralmente o início do que sobrou)
    const finalQuery = words.slice(0, 3).join(' ');

    console.log(`📸 Buscando imagem no Pixabay para: "${finalQuery}"`);

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    const searchParams = `&q=${encodeURIComponent(finalQuery)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=10&lang=en`;

    // 2. Execução da Busca Principal
    let response = await axios.get(baseUrl + searchParams, { timeout: 8000 });
    let hits = response.data.hits || [];

    // 3. Fallback: Se não achou com o prompt limpo, tenta apenas a categoria (mais seguro)
    if (hits.length === 0) {
      console.log(`⚠️ Sem resultados para "${finalQuery}". Tentando categoria...`);
      const fallbackTerm = courseData.categoryName || 'culinary';
      const fallbackUrl = `${baseUrl}&q=${encodeURIComponent(fallbackTerm)}&image_type=photo&orientation=horizontal&per_page=5&lang=en`;
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

    // 5. Download e Upload para o Sanity
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