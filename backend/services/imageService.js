const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.0.0-rc1
 * Sistema de busca em cascata com suporte a metadados para v1.0.0.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada.");
      return null;
    }

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    const baseParams = `&image_type=photo&orientation=horizontal&safesearch=true&per_page=15&lang=en`;

    // 1. Limpeza de Query (Remove ruído para o Pixabay)
    const cleanTerm = (text) => {
      if (!text) return "";
      return text
        .replace(/photographic|minimalist|professional|highly|a|of|the|with|on|an|single|serving|class|online|course|lesson|tutorial/gi, '')
        .replace(/[:.;?!#]/g, '')
        .trim();
    };

    // 2. Definição das tentativas (Cascata)
    // DICA: Se o curso for em PT, a IA deve idealmente gerar o imageSearchPrompt já em EN.
    const queries = [
      cleanTerm(courseData.imageSearchPrompt), // Tentativa 1: Prompt da IA
      cleanTerm(courseData.title),              // Tentativa 2: Título do Curso
      cleanTerm(courseData.categoryName || courseData.category) // Tentativa 3: Categoria
    ].filter(q => q && q.length > 2);

    let hits = [];
    let usedQuery = "";

    // 3. Execução da busca em cascata
    for (const query of queries) {
      console.log(`📸 Tentando buscar imagem para: "${query}"`);
      try {
        const response = await axios.get(`${baseUrl}&q=${encodeURIComponent(query)}${baseParams}`, { timeout: 8000 });

        if (response.data.hits && response.data.hits.length > 0) {
          hits = response.data.hits;
          usedQuery = query;
          break; 
        }
      } catch (err) {
        console.error(`⚠️ Falha na tentativa com a query "${query}":`, err.message);
        continue;
      }
    }

    if (hits.length === 0) {
      console.error("❌ Nenhuma imagem encontrada no Pixabay em nenhuma das tentativas.");
      return null; 
    }

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

    console.log(`✅ Imagem selecionada (ID: ${selectedImage.id}) para a query: "${usedQuery}"`);

    // 5. Download e Upload para o Sanity
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
    const buffer = Buffer.from(imageRes.data);

    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa: ${courseData.title}`,
      title: courseData.title,
      description: `Busca original: ${usedQuery} | Fonte: Pixabay ID ${selectedImage.id}`
    });

    // --- CORREÇÃO DE RETORNO: Mapeia para o que o Controller espera ---
    return {
      assetId: asset._id,
      externalId: String(selectedImage.id),
      searchPrompt: usedQuery
    };

  } catch (error) {
    console.error("❌ Erro fatal no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };