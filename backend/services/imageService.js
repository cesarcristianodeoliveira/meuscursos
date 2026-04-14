const axios = require('axios');
const client = require('../config/sanity');

/**
 * SERVIÇO DE IMAGENS (ImageService) v1.3
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
    const forbiddenTerms = /curso|aula|online|educação|aprendizado|estudo|dicas|como|course|lesson|education|learning|study|tips|how to|gera|gerado/gi;

    let queryParts = [
      courseData.categoryName,
      courseData.title,
      courseData.tags?.[0]
    ].filter(part => typeof part === 'string' && part.length > 0);

    let cleanQuery = queryParts
      .join(' ')
      .replace(/[:.;?!#]/g, '') // Remove pontuação
      .replace(forbiddenTerms, '') // Remove palavras genéricas
      .trim()
      .split(/\s+/)
      .slice(0, 3) // Mantém apenas as 3 palavras mais relevantes (evita queries longas demais)
      .join(' ');

    console.log(`📸 Buscando imagem no Pixabay para: "${cleanQuery}"`);

    const baseUrl = `https://pixabay.com/api/?key=${apiKey}`;
    const searchParams = `&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=15&lang=pt`;

    // 2. Execução da Busca Principal
    let response = await axios.get(baseUrl + searchParams, { timeout: 8000 });
    let hits = response.data.hits || [];

    // 3. Fallback: Se não achou nada, tenta apenas a Categoria (ou 'tecnologia' como última instância)
    if (hits.length === 0) {
      const fallbackTerm = courseData.categoryName || 'tecnologia';
      console.log(`⚠️ Sem resultados para "${cleanQuery}". Tentando fallback por: "${fallbackTerm}"`);
      const fallbackUrl = `${baseUrl}&q=${encodeURIComponent(fallbackTerm)}&image_type=photo&orientation=horizontal&per_page=5&lang=pt`;
      const fallbackRes = await axios.get(fallbackUrl);
      hits = fallbackRes.data.hits || [];
    }

    if (hits.length === 0) {
      console.warn("⚠️ Nenhuma imagem encontrada no Pixabay.");
      return null;
    }

    // 4. Verificação de Ineditismo (Deduplicação)
    let selectedImage = null;
    for (const hit of hits) {
      // Verifica se este ID do Pixabay já foi usado
      const alreadyUsed = await client.fetch(
        `count(*[_type == "course" && externalImageId == $id])`, 
        { id: String(hit.id) }
      );

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break;
      }
    }

    // Se todas as imagens da página já foram usadas, pegamos a primeira do resultado
    selectedImage = selectedImage || hits[0];

    // 5. Download da Imagem Selecionada
    const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
    
    const imageRes = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 15000 
    });

    const buffer = Buffer.from(imageRes.data);

    // 6. Upload para o Sanity Assets
    const asset = await client.assets.upload('image', buffer, {
      filename: `pixabay-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: `Capa: ${courseData.title}`,
      title: courseData.title,
      description: `Imagem via Pixabay ID: ${selectedImage.id}`
    });

    return {
      assetId: asset._id, // _id do asset no Sanity
      externalImageId: String(selectedImage.id) // Salvo para controle de duplicatas
    };

  } catch (error) {
    // Erro silencioso: se a imagem falhar, o curso continua sem capa (melhor que quebrar tudo)
    console.error("❌ Erro no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };