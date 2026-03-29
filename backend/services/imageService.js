const axios = require('axios');
const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');

/**
 * Busca uma imagem no Pixabay e faz o upload para o Sanity Assets.
 * Foca em termos visuais concretos para evitar imagens genéricas de "estudo".
 */
const fetchAndUploadImage = async (query, pixabayCategory = '') => {
  try {
    // 1. Limpeza da Query: Focamos no que é VISUAL
    // Se a IA mandou "woodworking tools", mantemos isso. 
    // Removemos ruídos que fazem o Pixabay retornar fotos de pessoas em escritórios.
    const cleanQuery = query
      .replace(/[:.;?!]/g, '') 
      .replace(/photography|photo|high quality|professional|course|lesson|education|learning|study/gi, '')
      .trim()
      .split(' ')
      .slice(0, 3) 
      .join(' ');

    // Mapeamento de categorias do Pixabay para evitar erros de busca
    // Se a categoria vinda da IA não bater com as do Pixabay, usamos busca global
    const validCategories = [
      'backgrounds', 'fashion', 'nature', 'science', 'education', 'feelings', 
      'health', 'people', 'religion', 'places', 'animals', 'industry', 
      'computer', 'food', 'sports', 'transportation', 'travel', 'buildings', 
      'business', 'music'
    ];
    
    const category = validCategories.includes(pixabayCategory.toLowerCase()) 
      ? pixabayCategory.toLowerCase() 
      : '';

    // 2. Construção da URL (Prioridade para a Query Visual)
    const baseUrl = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}`;
    const params = `&q=${encodeURIComponent(cleanQuery)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=30`;
    const categoryParam = category ? `&category=${category}` : '';
    
    let response = await axios.get(`${baseUrl}${params}${categoryParam}`);
    let hits = response.data.hits || [];

    // 3. Fallback 1: Se com categoria não deu nada, tenta busca global (sem categoria)
    if (hits.length === 0 && category) {
      console.log(`🔍 Fallback: Buscando "${cleanQuery}" sem restrição de categoria.`);
      const fallbackRes = await axios.get(`${baseUrl}${params}`);
      hits = fallbackRes.data.hits || [];
    }

    // 4. Fallback 2: Se ainda nada, tenta a categoria pura (ex: "Artesanato")
    if (hits.length === 0) {
      const catQuery = encodeURIComponent(pixabayCategory || 'technology');
      const catRes = await axios.get(`${baseUrl}&q=${catQuery}&image_type=photo&per_page=10`);
      hits = catRes.data.hits || [];
    }

    if (!hits || hits.length === 0) {
      console.log(`⚠️ Nenhuma imagem encontrada. Usando placeholder.`);
      return null; 
    }

    // 5. Verificação de Ineditismo (Deduplicação)
    let selectedImage = null;
    for (const hit of hits) {
      const queryCheck = `count(*[_type == "course" && externalImageId == $id])`;
      const alreadyUsed = await client.fetch(queryCheck, { id: String(hit.id) });

      if (alreadyUsed === 0) {
        selectedImage = hit;
        break; 
      }
    }

    // Se todas forem repetidas, pega a primeira do array mesmo
    selectedImage = selectedImage || hits[0];

    // 6. Download e Upload para o Sanity
    const imageRes = await axios.get(selectedImage.largeImageURL, { 
      responseType: 'arraybuffer',
      timeout: 15000 
    });
    
    const asset = await client.assets.upload('image', Buffer.from(imageRes.data), {
      filename: `${formatSlug(cleanQuery)}-${selectedImage.id}.jpg`,
      contentType: 'image/jpeg',
      label: cleanQuery 
    });

    console.log(`📸 Imagem definida para o curso: ${cleanQuery} (ID: ${selectedImage.id})`);

    return {
      assetId: asset._id,
      externalImageId: String(selectedImage.id)
    };

  } catch (error) {
    console.error("❌ Erro Crítico no ImageService:", error.message);
    return null;
  }
};

module.exports = { fetchAndUploadImage };