// D:\meuscursos\backend\controllers\pixabayController.js

import axios from 'axios';

// --- Variáveis para Cache da Pixabay Images ---
let cachedPixabayImages = {}; // Objeto para armazenar cache por termo de busca
const PIXABAY_CACHE_LIFETIME_MS = 6 * 60 * 60 * 1000; // 6 horas
let pixabayCacheTimestamps = {}; // Objeto para armazenar timestamps por termo de busca

// Função para buscar imagens do Pixabay
export const getPixabayImages = async (req, res) => {
    const { searchQuery } = req.query;

    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim() === '') {
        return res.status(400).json({ message: 'O termo de busca (searchQuery) é obrigatório.' });
    }

    const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
    if (!PIXABAY_API_KEY) {
        console.error("[Backend] PIXABAY_API_KEY não configurada no .env.");
        return res.status(500).json({ message: 'Chave da API Pixabay não configurada.' });
    }

    const cacheKey = searchQuery.toLowerCase().trim();
    const now = Date.now();

    // Tenta servir do cache se ele for válido
    if (cachedPixabayImages[cacheKey] && (now - pixabayCacheTimestamps[cacheKey] < PIXABAY_CACHE_LIFETIME_MS)) {
        console.log(`[Backend] Servindo imagens do Pixabay do cache para "${searchQuery}".`);
        return res.status(200).json(cachedPixabayImages[cacheKey]);
    }

    // Se o cache expirou ou não existe, chama a Pixabay API
    console.log(`[Backend] Cache de imagens Pixabay expirado ou não definido para "${searchQuery}". Chamando Pixabay API...`);
    try {
        const pixabayResponse = await axios.get('https://pixabay.com/api/', {
            params: {
                key: PIXABAY_API_KEY,
                q: searchQuery,
                image_type: 'photo',
                per_page: 10 // Limita a 10 imagens para evitar sobrecarga
            },
            timeout: 10000 // Timeout de 10 segundos
        });

        const images = pixabayResponse.data.hits.map(hit => ({
            id: hit.id,
            previewURL: hit.previewURL,
            webformatURL: hit.webformatURL, // URL da imagem maior
            tags: hit.tags,
            user: hit.user
        }));

        // Atualiza o cache e o timestamp
        cachedPixabayImages[cacheKey] = images;
        pixabayCacheTimestamps[cacheKey] = now;
        console.log(`[Backend] Buscadas e cacheadas ${images.length} imagens do Pixabay para "${searchQuery}".`);

        res.status(200).json(images);

    } catch (error) {
        console.error('Erro ao buscar imagens do Pixabay:', error.response?.data || error.message);
        // Se a Pixabay API falhar, tenta servir do cache antigo se ele existir, ou vazio se não
        if (cachedPixabayImages[cacheKey]) {
            console.warn("[Backend] Pixabay API call failed, serving stale cache if available.");
            return res.status(200).json(cachedPixabayImages[cacheKey]); // Serve o cache antigo
        } else {
            console.warn("[Backend] Pixabay API call failed and no cache available. Pixabay images will be empty.");
            return res.status(500).json({ message: 'Erro ao buscar imagens do Pixabay e sem cache disponível.', error: error.message });
        }
    }
};
