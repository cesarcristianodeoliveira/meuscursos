const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.2.0
 * Foco: Sincronia com Prompt de IA, Diversidade Visual e Performance.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada no ambiente.");
      return null;
    }

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    const baseParams = `&image_type=photo&orientation=horizontal&safesearch=true&per_page=20&lang=en&editors_choice=false`;

    // 1. Limpeza de Query Inteligente
    // Agora mantemos termos de qualidade (food, photography) mas removemos lixo estrutural
    const cleanTerm = (text) => {
      if (!text) return "";
      return text
        .toLowerCase()
        // Remove apenas palavras que REALMENTE estragam a busca no Pixabay
        .replace(/[:.;?!#]/g, '')
        .replace(/\b(a|an|the|of|by|for|at|in|on|course|lesson|tutorial|online|class)\b/gi, '')
        .trim()
        .split(/\s+/)
        .filter((word, index, self) => self.indexOf(word) === index)
        .join(' ');
    };

    // 2. Hierarquia de Busca (Cascata)
    // Damos prioridade total ao prompt gerado pela IA (que agora é descritivo)
    const queries = [
      cleanTerm(courseData.imageSearchPrompt), 
      cleanTerm(`${courseData.title} ${courseData.categoryName || ""}`),
      "abstract technology background" // Fallback genérico final
    ].filter(q => q && q.length > 2);

    let hits = [];
    let usedQuery = "";

    // 3. Execução em Cascata
    for (const query of queries) {
      console.log(`📸 Tentando busca Pixabay: "${query}"`);
      try {
        const response = await axios.get(`${baseUrl}&q=${encodeURIComponent(query)}${baseParams}`, { timeout: 8000 });

        if (response.data.hits && response.data.hits.length > 0) {
          hits = response.data.hits;
          usedQuery = query;
          break; 
        }
      } catch (err) {
        console.error(`⚠️ Falha na query "${query}":`, err.message);
        continue;
      }
    }

    if (hits.length === 0) return null;

    // 4. Seleção Anti-Repetição
    // Buscamos uma imagem que ainda não foi usada no banco de dados do Sanity
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

    // Se todas as fotos já foram usadas (raro), pegamos uma aleatória das top 5 (mais relevantes)
    selectedImage = selectedImage || hits[Math.floor(Math.random() * Math.min(5, hits.length))];

    console.log(`✅ Imagem selecionada! ID: ${selectedImage.id} via query: "${usedQuery}"`);

    // 5. Download e Upload para o Sanity
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
    const buffer = Buffer.from(imageRes.data);

    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Cover: ${courseData.title}`,
      title: courseData.title,
      // Metadados úteis para debug futuro
      description: `AI Prompt: ${courseData.imageSearchPrompt} | Used Query: ${usedQuery}`
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