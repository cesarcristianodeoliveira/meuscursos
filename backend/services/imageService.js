const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.4.0
 * Otimizado para buscas precisas no Pixabay e persistência no Sanity.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada no ambiente.");
      return null;
    }

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    // Configurações focadas em fotos horizontais de alta qualidade
    const baseParams = `&image_type=photo&orientation=horizontal&safesearch=true&per_page=20&lang=en`;

    /**
     * LIMPEZA DE QUERY PARA O PIXABAY
     * O Pixabay funciona melhor com palavras-chave simples separadas por espaços.
     */
    const cleanTerm = (text) => {
      if (!text) return "";
      return text
        .toLowerCase()
        .replace(/[,.:.;?!#"]/g, ' ') // Remove pontuação e vírgulas (substitui por espaço)
        .replace(/\b(course|lesson|tutorial|online|class|learning|education)\b/gi, '') // Remove ruído educacional
        .trim()
        .split(/\s+/)
        .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicatas
        .join(' ');
    };

    /**
     * HIERARQUIA DE BUSCA
     * 1. O prompt visual gerado pela IA (Ex: "keyboard coding dark")
     * 2. O título do curso limpo
     * 3. A categoria
     * 4. Fallback de alta qualidade
     */
    const queries = [
      cleanTerm(courseData.imageSearchPrompt),
      cleanTerm(courseData.title),
      cleanTerm(courseData.categoryName),
      "abstract professional technology background" 
    ].filter(q => q && q.length > 2);

    let hits = [];
    let usedQuery = "";

    for (const query of queries) {
      // O Pixabay ignora buscas muito longas, limitamos a 5 termos chave
      const optimizedQuery = query.split(' ').slice(0, 5).join(' ');
      
      console.log(`📸 Tentando Pixabay: [${optimizedQuery}]`);
      try {
        const response = await axios.get(`${baseUrl}&q=${encodeURIComponent(optimizedQuery)}${baseParams}`, { timeout: 5000 });

        if (response.data.hits && response.data.hits.length > 0) {
          hits = response.data.hits;
          usedQuery = optimizedQuery;
          break; 
        }
      } catch (err) {
        console.error(`⚠️ Falha na query "${optimizedQuery}":`, err.message);
        continue;
      }
    }

    if (hits.length === 0) return null;

    // Seleção inteligente: Prioriza fotos com selo de escolha dos editores
    let selectedImage = hits.find(h => h.editorsChoice) || hits[0];

    // Lógica Anti-Repetição: Tenta pegar uma imagem que ainda não foi usada
    for (const hit of hits) {
      const isUsed = await client.fetch(
        `count(*[_type == "course" && externalImageId == $id])`, 
        { id: String(hit.id) }
      );
      if (isUsed === 0) {
        selectedImage = hit;
        break;
      }
    }

    console.log(`✅ Imagem selecionada: ID ${selectedImage.id} via query "${usedQuery}"`);

    // Download da imagem (usando a versão largeImageURL para garantir nitidez)
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
    const buffer = Buffer.from(imageRes.data);

    // Upload para o Sanity
    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa: ${courseData.title}`,
      title: courseData.title
    });

    return {
      assetId: asset._id, // O que será salvo na referência do curso
      externalId: String(selectedImage.id)
    };

  } catch (error) {
    console.error("❌ Erro no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };