const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService)
 * Busca capas no Pixabay e faz o upload para o Sanity Assets.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    if (!process.env.PIXABAY_API_KEY) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada.");
      return null;
    }

    // 1. Limpeza e Refino da Query (Foco no Visual e Concreto)
    // Usamos o termo de busca da IA + a Categoria + a primeira Tag
    const rawTerms = [
      courseData.title, // Título do curso é o termo mais forte
      courseData.categoryName, 
      courseData.tags?.[0]
    ].filter(Boolean);

    // Removemos termos abstratos que confundem o Pixabay (ex: "course", "online")
    const cleanQuery = rawTerms
      .join(' ')
      .replace(/[:.;?!#]/g, '')
      .replace(/course|lesson|education|learning|study|online|tips|how to/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3) // Pixabay performa melhor com no máximo 3 palavras-chave
      .join(' ');

    console.log(`📸 Buscando imagem para: "${cleanQuery}"`);

    const baseUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}`;
    const params = `&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=10`;

    // 2. Primeira Tentativa: Busca Específica
    let response = await axios.get(baseUrl + params, { timeout: 8000 });
    let hits = response.data.hits || [];

    // 3. Fallback: Se não achou nada, busca apenas pela Categoria ou Termo Genérico
    if (hits.length === 0) {
      console.log(`⚠️ Sem resultados para "${cleanQuery}". Tentando termo genérico...`);
      const fallbackTerm = courseData.categoryName || 'technology';
      const fallbackRes = await axios.get(`${baseUrl}&q=${encodeURIComponent(fallbackTerm)}&image_type=photo&per_page=5`);
      hits = fallbackRes.data.hits || [];
    }

    if (hits.length === 0) return null;

    // 4. Verificação de Ineditismo (Deduplicação)
    // Percorre os resultados e pega o primeiro que ainda não foi usado no Sanity
    let selectedImage = null;
    for (const hit of hits) {
      const alreadyUsed = await client.fetch(
        `count(*[_type == "course" && aiMetadata.externalImageId == $id])`, 
        { id: String(hit.id) }
      );

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break;
      }
    }

    // Se todas forem repetidas, pegamos a melhor (a primeira)
    selectedImage = selectedImage || hits[0];

    // 5. Download e Upload para o Sanity Assets
    const imageRes = await axios.get(selectedImage.largeImageURL, { 
      responseType: 'arraybuffer',
      timeout: 15000 
    });

    const buffer = Buffer.from(imageRes.data);
    
    // O nome do arquivo inclui o ID do Pixabay para evitar lixo no Sanity
    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: cleanQuery 
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