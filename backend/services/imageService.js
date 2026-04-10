const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService)
 * Busca capas no Pixabay, evita duplicatas e faz o upload para o Sanity.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada. Pulando busca de imagem.");
      return null;
    }

    // 1. Refino da Query (Otimização para o Pixabay)
    // Removemos stop-words e termos que geram imagens genéricas de "estudo"
    const forbiddenTerms = /curso|aula|online|educação|aprendizado|estudo|dicas|como|course|lesson|education|learning|study|tips|how to/gi;
    
    let queryParts = [
      courseData.categoryName,
      courseData.title,
      courseData.tags?.[0]
    ].filter(Boolean);

    let cleanQuery = queryParts
      .join(' ')
      .replace(/[:.;?!#]/g, '')
      .replace(forbiddenTerms, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3) 
      .join(' ');

    console.log(`📸 Buscando imagem no Pixabay para: "${cleanQuery}"`);

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    const searchParams = `&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=10&lang=pt`;

    // 2. Execução da Busca
    let response = await axios.get(baseUrl + searchParams, { timeout: 8000 });
    let hits = response.data.hits || [];

    // 3. Fallback: Se não achou com o título, tenta apenas a Categoria (mais genérico)
    if (hits.length === 0) {
      console.log(`⚠️ Sem resultados para "${cleanQuery}". Tentando categoria: ${courseData.categoryName}`);
      const fallbackUrl = `${baseUrl}&q=${encodeURIComponent(courseData.categoryName || 'tecnologia')}&image_type=photo&orientation=horizontal&per_page=5&lang=pt`;
      const fallbackRes = await axios.get(fallbackUrl);
      hits = fallbackRes.data.hits || [];
    }

    if (hits.length === 0) return null;

    // 4. Verificação de Ineditismo (Deduplicação)
    let selectedImage = null;
    for (const hit of hits) {
      // Verificamos se já existe um curso com esse ID externo para não repetir capas
      const alreadyUsed = await client.fetch(
        `count(*[_type == "course" && externalImageId == $id])`, 
        { id: String(hit.id) }
      );

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break;
      }
    }

    // Se todas as 10 da página já foram usadas, pegamos a primeira do hit original
    selectedImage = selectedImage || hits[0];

    // 5. Download da Imagem Selecionada
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    const imageRes = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 15000 
    });

    const buffer = Buffer.from(imageRes.data);

    // 6. Upload para o Sanity Assets
    // Vinculamos o ID do Pixabay no metadata do asset para controle futuro
    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa: ${courseData.title}` 
    });

    return {
      assetId: asset._id, // Usado para o campo 'thumbnail'
      externalImageId: String(selectedImage.id) // Usado para o campo 'externalImageId'
    };

  } catch (error) {
    console.error("❌ Erro no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };