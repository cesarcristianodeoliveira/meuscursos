const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.4.0 - Edição de Lançamento
 * Inteligência em cascata para garantir capas de alta qualidade em qualquer tema.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada. O curso ficará sem capa.");
      return null;
    }

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    const baseParams = `&image_type=photo&orientation=horizontal&safesearch=true&per_page=15&lang=en`;

    /**
     * Limpeza inteligente: Mantém a essência visual e remove ruídos gramaticais.
     */
    const cleanTerm = (text) => {
      if (!text) return "";
      return text
        .toLowerCase()
        .replace(/[:.;?!#"]/g, '') 
        .replace(/\b(course|lesson|tutorial|online|class|ai|generated|module|exame)\b/gi, '') 
        .trim()
        .split(/\s+/)
        .filter((word, index, self) => self.indexOf(word) === index)
        .join(' ');
    };

    /**
     * HIERARQUIA DE BUSCA (Fallback Progressivo)
     * 1. O Prompt Artístico da IA (LXD)
     * 2. O Título do curso (mais direto)
     * 3. Termo Abstrato Profissional (Garante que nunca venha vazio)
     */
    const queries = [
      cleanTerm(courseData.imageSearchPrompt),
      cleanTerm(courseData.title),
      "professional elegant abstract background" 
    ].filter(q => q && q.length > 2);

    let hits = [];
    let usedQuery = "";

    for (const query of queries) {
      // Limita a 7 palavras para máxima eficiência no Pixabay
      const shortQuery = query.split(' ').slice(0, 7).join(' ');
      
      try {
        const response = await axios.get(`${baseUrl}&q=${encodeURIComponent(shortQuery)}${baseParams}`, { timeout: 6000 });

        if (response.data.hits && response.data.hits.length > 0) {
          hits = response.data.hits;
          usedQuery = shortQuery;
          break; 
        }
      } catch (err) {
        console.error(`⚠️ Erro na query "${shortQuery}":`, err.message);
        continue;
      }
    }

    if (hits.length === 0) return null;

    // Seleção inteligente: Prioriza Escolha do Editor ou a primeira imagem
    let selectedImage = hits.find(h => h.editorsChoice) || hits[0];

    // Lógica Anti-Repetição: Busca imagens ainda não utilizadas no Sanity
    try {
      for (const hit of hits.slice(0, 5)) {
        const usageCount = await client.fetch(
          `count(*[_type == "course" && externalImageId == $id])`, 
          { id: String(hit.id) }
        );
        if (usageCount === 0) {
          selectedImage = hit;
          break;
        }
      }
    } catch (dbErr) {
      console.warn("⚠️ Falha ao verificar duplicatas, prosseguindo com a melhor opção.");
    }

    // Processamento do Upload
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 12000 });
    const buffer = Buffer.from(imageRes.data);

    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa: ${courseData.title}`,
      title: courseData.title
    });

    // Retorno estruturado para o Controller
    return {
      assetId: asset._id,
      externalId: String(selectedImage.id),
      finalPrompt: usedQuery
    };

  } catch (error) {
    console.error("❌ Falha crítica no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };