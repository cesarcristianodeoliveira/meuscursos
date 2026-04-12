const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService)
 * Busca capas no Pixabay, evita duplicatas e faz o upload para o Sanity Assets.
 */

const fetchAndUploadImage = async (courseData) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ PIXABAY_API_KEY não configurada. O curso será criado sem capa.");
      return null;
    }

    // 1. Refino da Query (Otimização para o Pixabay)
    // Filtramos termos que poluem a busca visual e focamos no assunto real.
    const forbiddenTerms = /curso|aula|online|educação|aprendizado|estudo|dicas|como|course|lesson|education|learning|study|tips|how to/gi;

    let queryParts = [
      courseData.categoryName,
      courseData.title,
      courseData.tags?.[0]
    ].filter(Boolean);

    let cleanQuery = queryParts
      .join(' ')
      .replace(/[:.;?!#]/g, '') // Remove pontuação
      .replace(forbiddenTerms, '') // Remove palavras genéricas
      .trim()
      .split(/\s+/)
      .slice(0, 3) // Mantém apenas as 3 palavras mais relevantes
      .join(' ');

    console.log(`📸 Buscando imagem no Pixabay para: "${cleanQuery}"`);

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    const searchParams = `&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=15&lang=pt`;

    // 2. Execução da Busca Principal
    let response = await axios.get(baseUrl + searchParams, { timeout: 8000 });
    let hits = response.data.hits || [];

    // 3. Fallback: Se não achou nada com o título, tenta apenas a Categoria (mais seguro)
    if (hits.length === 0) {
      console.log(`⚠️ Sem resultados para "${cleanQuery}". Tentando fallback por categoria.`);
      const fallbackUrl = `${baseUrl}&q=${encodeURIComponent(courseData.categoryName || 'tecnologia')}&image_type=photo&orientation=horizontal&per_page=5&lang=pt`;
      const fallbackRes = await axios.get(fallbackUrl);
      hits = fallbackRes.data.hits || [];
    }

    if (hits.length === 0) {
      console.warn("⚠️ Nenhuma imagem encontrada no Pixabay, nem no fallback.");
      return null;
    }

    // 4. Verificação de Ineditismo (Deduplicação)
    let selectedImage = null;
    for (const hit of hits) {
      // Query GROQ para verificar se este ID do Pixabay já foi usado em outro documento
      const alreadyUsed = await client.fetch(
        `count(*[_type == "course" && externalImageId == $id])`, 
        { id: String(hit.id) }
      );

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break;
      }
    }

    // Se todas as imagens da página já foram usadas, pegamos a primeira do resultado original
    selectedImage = selectedImage || hits[0];

    // 5. Download da Imagem Selecionada
    // Priorizamos a imagem grande, mas temos o webformatURL como plano B
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    
    const imageRes = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 15000 
    });

    const buffer = Buffer.from(imageRes.data);

    // 6. Upload para o Sanity Assets
    // O Sanity cria um 'asset' que pode ser referenciado em múltiplos campos
    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa Gerada: ${courseData.title}`,
      title: courseData.title,
      description: `Imagem via Pixabay ID: ${selectedImage.id}`
    });

    return {
      assetId: asset._id, // Referência interna do Sanity (image.asset._ref)
      externalImageId: String(selectedImage.id) // Controle de deduplicação no Schema
    };

  } catch (error) {
    // Tratamento de erro silencioso para não interromper a criação do curso se a imagem falhar
    console.error("❌ Erro no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };