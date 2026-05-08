const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.3.0
 * Otimizado para prompts artísticos e cascata de busca inteligente.
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

    /**
     * LIMPEZA DE QUERY PRESERVATIVA
     * Remove pontuação e lixo, mas mantém adjetivos visuais (cinematic, moody, lighting).
     */
    const cleanTerm = (text) => {
      if (!text) return "";
      return text
        .toLowerCase()
        .replace(/[:.;?!#"]/g, '') // Remove pontuação pesada
        .replace(/\b(course|lesson|tutorial|online|class|ai|generated)\b/gi, '') // Remove termos proibidos
        .trim()
        .split(/\s+/)
        .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicatas
        .join(' ');
    };

    /**
     * HIERARQUIA DE BUSCA EM CASCATA (Relaxamento de Query)
     * 1. Prompt Artístico Completo (ex: "Cinematic coffee brewing in sunlight")
     * 2. Apenas o Título do Curso (ex: "Coffee Brewing Basics")
     * 3. Apenas a Categoria (ex: "Gastronomia")
     * 4. Fallback visual abstrato de alta qualidade
     */
    const queries = [
      cleanTerm(courseData.imageSearchPrompt),
      cleanTerm(courseData.title),
      cleanTerm(courseData.categoryName),
      "professional background aesthetic" 
    ].filter(q => q && q.length > 2);

    let hits = [];
    let usedQuery = "";

    for (const query of queries) {
      // Pega apenas as primeiras 6 palavras para o Pixabay não se perder em prompts longos demais
      const shortQuery = query.split(' ').slice(0, 7).join(' ');
      
      console.log(`📸 Buscando Pixabay: "${shortQuery}"`);
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

    // SELEÇÃO: Prioriza "Editor's Choice" se houver, senão pega a melhor correspondência
    let selectedImage = hits.find(h => h.editorsChoice) || hits[0];

    // Evita repetição: Se a imagem já foi usada em muitos cursos, tenta a próxima do array
    for (const hit of hits) {
      const usageCount = await client.fetch(
        `count(*[_type == "course" && externalImageId == $id])`, 
        { id: String(hit.id) }
      );
      if (usageCount === 0) {
        selectedImage = hit;
        break;
      }
    }

    console.log(`✅ Imagem definida! ID: ${selectedImage.id} via: "${usedQuery}"`);

    // DOWNLOAD E UPLOAD
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 12000 });
    const buffer = Buffer.from(imageRes.data);

    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa: ${courseData.title}`,
      title: courseData.title,
      description: `Original Prompt: ${courseData.imageSearchPrompt} | Used: ${usedQuery}`
    });

    return {
      assetId: asset._id,
      externalId: String(selectedImage.id),
      searchPrompt: usedQuery
    };

  } catch (error) {
    console.error("❌ Falha crítica no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };