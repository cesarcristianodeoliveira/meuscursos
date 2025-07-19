// D:\meuscursos\backend\controllers\dataController.js

import axios from 'axios';
import { createClient } from '@sanity/client'; // Importa o cliente Sanity

// --- Configurações da Gemini API ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

// --- Variáveis para Cache da Gemini Categories ---
let cachedGeminiCategories = null;
const GEMINI_CATEGORY_CACHE_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
let geminiCategoryCacheTimestamp = 0;

// --- Configurações do Sanity Client ---
const sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: process.env.SANITY_API_VERSION || '2023-05-03', // Use a API version mais recente ou a sua
    token: process.env.SANITY_TOKEN, // Apenas se o acesso exigir autenticação
    useCdn: true, // Use CDN para leituras mais rápidas
});

// Helper para parsear a resposta JSON do Gemini
const parseGeminiResponse = (response) => {
    try {
        const text = response.data.candidates[0].content.parts[0].text;
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error('Erro ao parsear resposta do Gemini:', error);
        try {
            const rawText = response.data.candidates[0].content.parts[0].text;
            const match = rawText.match(/\[\s*"(.*?)"(?:\s*,\s*"(.*?)")*\s*\]/s);
            if (match && match[0]) {
                return JSON.parse(match[0]);
            }
        } catch (e) {
            console.error('Erro ao tentar extrair array de strings do texto bruto:', e);
        }
        return [];
    }
};

// --- Funções para Categorias (Combinando Sanity e Gemini) ---
export const getTopCategories = async (req, res) => {
    let sanityCategories = [];
    let geminiSuggestedCategories = [];

    // 1. Buscar Categorias do Sanity
    try {
        // Assume que você tem um tipo de documento 'category' no Sanity
        // e que ele tem um campo 'name' e talvez um 'slug' ou 'id'
        const query = `*[_type == "category"]{_id, name}`;
        sanityCategories = await sanityClient.fetch(query);
        console.log(`[Backend] Buscadas ${sanityCategories.length} categorias do Sanity.`);
    } catch (error) {
        console.error('Erro ao buscar categorias do Sanity:', error.message);
        // Não falha a requisição inteira se o Sanity falhar, apenas continua sem as categorias do Sanity
    }

    // 2. Buscar Categorias da Gemini (com cache)
    if (!GEMINI_API_KEY) {
        console.warn("[Backend] GEMINI_API_KEY não configurada. Não será possível gerar categorias com Gemini.");
    } else {
        const now = Date.now();
        if (cachedGeminiCategories && (now - geminiCategoryCacheTimestamp < GEMINI_CATEGORY_CACHE_LIFETIME_MS)) {
            console.log("[Backend] Servindo categorias da Gemini do cache.");
            geminiSuggestedCategories = cachedGeminiCategories;
        } else {
            console.log("[Backend] Cache de categorias Gemini expirado ou não definido. Chamando Gemini API...");
            try {
                const geminiPrompt = `Liste 10 categorias de cursos populares e em alta demanda (por exemplo: "Tecnologia", "Marketing", "Arte e Design", "Idiomas", "Negócios", "Saúde e Bem-estar", "Finanças", "Desenvolvimento Pessoal", "Fotografia", "Culinária"). Responda APENAS com uma lista JSON de strings, sem descrições ou textos adicionais, sem markdown. Exemplo: ["Programação", "Marketing Digital"]`;

                const geminiResponse = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
                    { contents: [{ parts: [{ text: geminiPrompt }] }] },
                    { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
                );

                const suggestedNames = parseGeminiResponse(geminiResponse);
                geminiSuggestedCategories = suggestedNames.map(name => ({
                    _id: `gemini-${name.toLowerCase().replace(/\s/g, '-')}`, // ID para categorias Gemini
                    name: name
                }));

                cachedGeminiCategories = geminiSuggestedCategories;
                geminiCategoryCacheTimestamp = now;
                console.log(`[Backend] Geradas e cacheadas ${geminiSuggestedCategories.length} categorias da Gemini.`);

            } catch (geminiError) {
                console.error('Erro ao chamar Gemini API para categorias:', geminiError.response?.data || geminiError.message);
                if (geminiError.response && geminiError.response.status === 429) {
                    return res.status(429).json({ message: 'Cota da Gemini API excedida. Por favor, verifique seu plano e tente novamente mais tarde.' });
                }
                if (cachedGeminiCategories) {
                    console.warn("[Backend] Gemini API call failed, serving stale cache if available.");
                    geminiSuggestedCategories = cachedGeminiCategories; // Serve o cache antigo
                } else {
                    console.warn("[Backend] Gemini API call failed and no cache available.");
                    // Não retorna erro 500 aqui para permitir que as categorias do Sanity sejam exibidas
                }
            }
        }
    }

    // 3. Combinar, Remover Duplicatas e Ordenar
    const combinedCategoriesMap = new Map(); // Usar Map para garantir unicidade pelo nome

    // Adiciona categorias do Sanity (prioridade)
    sanityCategories.forEach(cat => {
        // Normaliza o nome para a chave do mapa para evitar duplicatas por capitalização
        const normalizedName = cat.name.toLowerCase();
        combinedCategoriesMap.set(normalizedName, { _id: cat._id, name: cat.name });
    });

    // Adiciona categorias sugeridas pela Gemini se não existirem já pelo nome
    geminiSuggestedCategories.forEach(cat => {
        const normalizedName = cat.name.toLowerCase();
        if (!combinedCategoriesMap.has(normalizedName)) {
            combinedCategoriesMap.set(normalizedName, { _id: cat._id, name: cat.name });
        }
    });

    // Converte o Map de volta para um array
    const finalCategories = Array.from(combinedCategoriesMap.values());

    // Ordena alfabeticamente pelo nome
    finalCategories.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[Backend] Total de ${finalCategories.length} categorias combinadas (Sanity + Gemini).`);
    res.status(200).json(finalCategories);
};
