const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.0.2
 * Sistema de busca inteligente com pesos semânticos e deduplicação.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada.");
      return null;
    }

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    const baseParams = `&image_type=photo&orientation=horizontal&safesearch=true&per_page=20&lang=en&category=food,education,computer,science`;

    // 1. Limpeza de Query Profissional
    const cleanTerm = (text) => {
      if (!text) return "";
      // Remove stop-words, erros comuns da IA e caracteres especiais
      return text
        .toLowerCase()
        .replace(/photographic|minimalist|professional|highly|a|of|the|with|on|an|single|serving|class|online|course|lesson|tutorial|photography|image|photo/gi, '')
        .replace(/[:.;?!#]/g, '')
        .trim()
        .split(/\s+/)
        .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicatas na query
        .join(' ');
    };

    // 2. Construção de Queries por Peso (Cascata v1.0.2)
    // Agora combinamos categoria + tags para evitar resultados como "Pierogi"
    const tagsEn = courseData.tags ? courseData.tags.join(' ') : "";
    
    const queries = [
      // Tentativa 1: Prompt Direto da IA (Geralmente mais específico se a IA seguir o novo System Prompt)
      cleanTerm(courseData.imageSearchPrompt), 
      
      // Tentativa 2: Categoria + Tags (Contexto Semântico Forte)
      cleanTerm(`${courseData.categoryName || ""} ${tagsEn}`),
      
      // Tentativa 3: Título do Curso (Último recurso, pode ser muito subjetivo)
      cleanTerm(courseData.title)
    ].filter(q => q && q.length > 2);

    let hits = [];
    let usedQuery = "";

    // 3. Execução da busca em cascata
    for (const query of queries) {
      console.log(`📸 Buscando imagem (v1.0.2) para: "${query}"`);
      try {
        const response = await axios.get(`${baseUrl}&q=${encodeURIComponent(query)}${baseParams}`, { timeout: 8000 });

        if (response.data.hits && response.data.hits.length > 0) {
          hits = response.data.hits;
          usedQuery = query;
          break; 
        }
      } catch (err) {
        console.error(`⚠️ Erro na query "${query}":`, err.message);
        continue;
      }
    }

    if (hits.length === 0) {
      console.error("❌ Nenhuma imagem encontrada em nenhuma tentativa.");
      return null; 
    }

    // 4. Verificação de Ineditismo (Evita repetir capas no feed)
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

    // Se todas já foram usadas, pega a primeira do set atual para não ficar sem imagem
    selectedImage = selectedImage || hits[0];

    console.log(`✅ Sucesso! ID: ${selectedImage.id} | Query: "${usedQuery}"`);

    // 5. Upload para o Sanity
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
    const buffer = Buffer.from(imageRes.data);

    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa: ${courseData.title}`,
      title: courseData.title,
      description: `Query: ${usedQuery} | Pixabay ID ${selectedImage.id}`
    });

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