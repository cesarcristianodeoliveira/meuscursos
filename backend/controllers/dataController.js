// D:\meuscursos\backend\controllers\dataController.js
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

// --- Configuração do Sanity Client para LEITURA ---
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em dataController.");
}

const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12',
    useCdn: true,
    token: process.env.SANITY_TOKEN,
}) : null;

// --- Configuração da Gemini API ---
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida em dataController.");
}
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

// --- Variáveis para Cache da Gemini Categories ---
let cachedGeminiCategories = null;
const CACHE_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
let cacheTimestamp = 0;

// --- Funções do Controlador de Dados ---

// ... (Mantenha suas funções existentes: getCourseCategories, getCourseSubCategories, getCourseTagsByCategory, getAllTags) ...

/**
 * @function getTopCategories
 * @description Retorna categorias de cursos combinando Sanity e Gemini, sem duplicatas e em ordem alfabética.
 * @route GET /api/courses/create/top-categories
 * @access Protected
 */
export const getTopCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const sanityCategories = await sanityClient.fetch(`*[_type == "courseCategory"] | order(title asc) {_id, title}`);
        console.log(`[Backend] Found ${sanityCategories.length} categories from Sanity.`);

        let geminiSuggestedCategories = [];

        // --- Lógica de Cache para Gemini Categories ---
        const now = Date.now();
        if (cachedGeminiCategories && (now - cacheTimestamp < CACHE_LIFETIME_MS)) {
            console.log("[Backend] Serving Gemini categories from cache.");
            geminiSuggestedCategories = cachedGeminiCategories;
        } else if (GEMINI_API_KEY) { // Chama a Gemini API apenas se a chave estiver disponível e o cache expirou
            console.log("[Backend] Cache expired or not set. Calling Gemini API for categories...");
            try {
                const geminiPrompt = "Liste 10 categorias de cursos online que são atualmente muito populares e em alta demanda no mercado global de educação, focando nas áreas que geram mais interesse e busca por parte dos alunos. Responda APENAS com uma lista JSON de strings, sem descrições ou textos adicionais, sem markdown (```json). Exemplo: [\"Inteligência Artificial\", \"Desenvolvimento Web Fullstack\"]";

                const geminiResponse = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: geminiPrompt
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 20000
                    }
                );

                const geminiText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
                if (geminiText) {
                    // Tenta encontrar o array JSON exato na string
                    const jsonMatch = geminiText.match(/\[\s*".*?"(?:\s*,\s*".*?")*\s*\]/s);
                    
                    if (jsonMatch && jsonMatch[0]) {
                        const extractedJsonString = jsonMatch[0];
                        try {
                            const parsedCategories = JSON.parse(extractedJsonString);
                            if (Array.isArray(parsedCategories)) {
                                geminiSuggestedCategories = parsedCategories.map(name => ({
                                    _id: `gemini-${name.replace(/\s+/g, '-').toLowerCase()}-${
                                        Array.from(name).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0)
                                    }`,
                                    title: name
                                }));
                                // Atualiza o cache e o timestamp
                                cachedGeminiCategories = geminiSuggestedCategories;
                                cacheTimestamp = now;
                                console.log(`[Backend] Generated and cached ${geminiSuggestedCategories.length} categories from Gemini.`);
                            } else {
                                console.error("[Backend] Gemini response was not an array after parsing:", parsedCategories);
                            }
                        } catch (parseError) {
                            console.error('[Backend] Erro ao parsear JSON da Gemini para categorias (cache):', parseError);
                            console.error("[Backend] Gemini text that failed parsing (after regex):", extractedJsonString);
                        }
                    } else {
                        console.error("[Backend] Não foi possível extrair um array JSON válido da resposta da Gemini (cache).");
                        console.error("[Backend] Resposta original da Gemini:", geminiText);
                    }
                } else {
                    console.warn("[Backend] Gemini API returned no text content for categories (cache).");
                }
            } catch (geminiError) {
                console.error('[Backend] Erro ao chamar Gemini API para categorias (cache):', geminiError.response?.data?.error || geminiError.message);
                // Se a Gemini falhar, tentamos servir do cache antigo se ele existir, ou vazio se não
                if (cachedGeminiCategories) {
                    geminiSuggestedCategories = cachedGeminiCategories;
                    console.warn("[Backend] Gemini API call failed, serving stale cache if available.");
                } else {
                    geminiSuggestedCategories = [];
                    console.warn("[Backend] Gemini API call failed and no cache available.");
                }
            }
        } else {
            console.warn("[Backend] GEMINI_API_KEY não definida. Sugestões de categorias da Gemini serão ignoradas.");
        }

        // 3. Combinar e remover duplicatas (case-insensitive para o título)
        const combinedCategoriesMap = new Map();

        // Adiciona categorias do Sanity primeiro
        sanityCategories.forEach(cat => {
            combinedCategoriesMap.set(cat.title.toLowerCase(), cat);
        });

        // Adiciona categorias sugeridas pela Gemini, se ainda não existirem
        geminiSuggestedCategories.forEach(geminiCat => {
            if (!combinedCategoriesMap.has(geminiCat.title.toLowerCase())) {
                combinedCategoriesMap.set(geminiCat.title.toLowerCase(), geminiCat);
            } else {
                console.log(`[Backend] Skipping duplicate Gemini category: ${geminiCat.title}`);
            }
        });

        // Converte o Map de volta para um array e ordena alfabeticamente
        const finalCategories = Array.from(combinedCategoriesMap.values()).sort((a, b) =>
            a.title.localeCompare(b.title)
        );

        res.status(200).json({ categories: finalCategories });

    } catch (error) {
        console.error('[Backend] Erro no controller getTopCategories (final):', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar categorias combinadas.' });
    }
};

// --- Mantenha suas outras funções aqui ---
export const getTopSubCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const { categoryId } = req.query;
        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID é obrigatório para buscar subcategorias.' });
        }
        const subCategories = await sanityClient.fetch(
            `*[_type == "courseSubCategory" && parentCategory._ref == $categoryId] | order(title asc) {_id, title, "categoryRef": parentCategory._ref}`,
            { categoryId }
        );
        res.status(200).json({ subCategories });
    } catch (error) {
        console.error("Erro ao buscar subcategorias do Sanity:", error);
        res.status(500).json({ error: 'Erro ao buscar subcategorias.', details: error.message });
    }
};

export const getTopTags = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const { categoryId, subCategoryId } = req.query;
        if (!categoryId || !subCategoryId) {
            return res.status(400).json({ message: 'Category ID e Subcategory ID são obrigatórios para buscar tags.' });
        }
        const tags = await sanityClient.fetch(
            `*[_type == "courseTag" && $categoryId in categories[]._ref && $subCategoryId in subCategories[]._ref] | order(name asc) {_id, name}`,
            { categoryId, subCategoryId }
        );
        const tagNames = tags.map(tag => tag.name);
        res.status(200).json({ tags: tagNames });
    } catch (error) {
        console.error('Erro ao buscar tags:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar as tags.', error: error.message });
    }
};