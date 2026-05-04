const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.1.0
 * Foco: Precisão visual, Fallback inteligente e Sincronia com IA.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada no ambiente.");
      return null;
    }

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    
    /**
     * Ajuste Estratégico: Removemos o filtro fixo de categorias 
     * para permitir que o app cresça além de comida e tecnologia.
     */
    const baseParams = `&image_type=photo&orientation=horizontal&safesearch=true&per_page=30&lang=en`;

    // 1. Limpeza de Query (Otimizada para APIs de imagem)
    const cleanTerm = (text) => {
      if (!text) return "";
      return text
        .toLowerCase()
        // Remove termos descritivos que poluem a busca por fotos reais
        .replace(/photographic|minimalist|professional|highly|a|of|the|with|an|single|serving|class|online|course|lesson|tutorial|photography|image|photo/gi, '')
        .replace(/[:.;?!#]/g, '')
        .trim()
        .split(/\s+/)
        .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicatas
        .join(' ');
    };

    // 2. Hierarquia de Busca (Cascata)
    // Agora priorizamos o termo simplificado que a IA gera (ex: "Rice")
    const queries = [
      cleanTerm(courseData.imageSearchPrompt), 
      cleanTerm(`${courseData.categoryName || ""} ${courseData.tags?.[0] || ""}`),
      cleanTerm(courseData.title)
    ].filter(q => q && q.length > 2);

    let hits = [];
    let usedQuery = "";

    // 3. Execução em Cascata
    for (const query of queries) {
      console.log(`📸 Buscando imagem para: "${query}"`);
      try {
        const response = await axios.get(`${baseUrl}&q=${encodeURIComponent(query)}${baseParams}`, { timeout: 8000 });

        if (response.data.hits && response.data.hits.length > 0) {
          hits = response.data.hits;
          usedQuery = query;
          break; 
        }
      } catch (err) {
        console.error(`⚠️ Erro na tentativa com "${query}":`, err.message);
        continue;
      }
    }

    if (hits.length === 0) {
      console.error("❌ Nenhuma imagem encontrada no Pixabay para este curso.");
      return null; 
    }

    // 4. Inteligência de Seleção (Evita capas idênticas no App)
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

    // Se todas as fotos da página já foram usadas, seleciona uma aleatória do set atual
    selectedImage = selectedImage || hits[Math.floor(Math.random() * hits.length)];

    console.log(`✅ Capa definida! ID: ${selectedImage.id} | Termo final: "${usedQuery}"`);

    // 5. Upload para o CDN do Sanity
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
    const buffer = Buffer.from(imageRes.data);

    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa: ${courseData.title}`,
      title: courseData.title,
      description: `Busca IA: ${usedQuery} | Pixabay ID ${selectedImage.id}`
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