// D:\meuscursos\backend\controllers\dataController.js
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios'; // Importar axios para requisições à Gemini API

// --- Configuração do Sanity Client para LEITURA ---
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em dataController.");
}

const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12',
    useCdn: true, // Usar CDN para leituras (melhora performance)
    token: process.env.SANITY_TOKEN, // Seu token é necessário mesmo para leituras se o dataset for privado
}) : null;

// --- Configuração da Gemini API ---
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida em dataController.");
}
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Funções do Controlador de Dados ---

// Funções existentes (mantidas, mas não são as "top" que combinam com Gemini)
export const getCourseCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const query = `*[_type == "courseCategory"] | order(title asc) {_id, title, description}`;
        const categories = await sanityClient.fetch(query);
        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao buscar categorias do Sanity:", error);
        res.status(500).json({ error: 'Erro ao buscar categorias de cursos.', details: error.message });
    }
};

export const getCourseSubCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const query = `*[_type == "courseSubCategory"] | order(title asc) {_id, title, description, "categoryRef": parentCategory._ref}`;
        const subCategories = await sanityClient.fetch(query);
        res.status(200).json(subCategories);
    } catch (error) {
        console.error("Erro ao buscar subcategorias do Sanity:", error);
        res.status(500).json({ error: 'Erro ao buscar subcategorias de cursos.', details: error.message });
    }
};

export const getCourseTagsByCategory = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const { categoryId } = req.params;
        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID é obrigatório para buscar tags.' });
        }
        const tags = await sanityClient.fetch(
            `*[_type == "courseTag" && $categoryId in categories[]._ref] | order(name asc) { name }`,
            { categoryId }
        );
        const tagNames = tags.map(tag => tag.name);
        res.status(200).json(tagNames);
    } catch (error) {
        console.error('Erro ao buscar tags por categoria:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tags por categoria.', error: error.message });
    }
};

export const getAllTags = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const { categoryId } = req.query;
        let query;
        let params = {};
        if (categoryId) {
            query = `*[_type == "courseTag" && $categoryId in categories[]._ref] | order(name asc) { _id, name }`;
            params = { categoryId };
            console.log(`[BACKEND - getAllTags] Buscando tags para a categoria: ${categoryId}`);
        } else {
            query = `*[_type == "courseTag"] | order(name asc) { _id, name }`;
            console.log("[BACKEND - getAllTags] Buscando todas as tags.");
        }
        const tags = await sanityClient.fetch(query, params);
        res.status(200).json(tags);
    } catch (error) {
        console.error("Erro ao buscar tags do Sanity (getAllTags):", error);
        res.status(500).json({ error: 'Erro ao buscar tags de cursos.', details: error.message });
    }
};

/**
 * @function getTopCategories
 * @description Retorna categorias de cursos combinando Sanity e Gemini, sem duplicatas.
 * @route GET /api/courses/create/top-categories
 * @access Protected
 */
export const getTopCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        // 1. Buscar categorias existentes do Sanity
        const sanityCategories = await sanityClient.fetch(`*[_type == "courseCategory"] | order(title asc) {_id, title}`);

        // 2. Buscar 10 categorias populares da Gemini API
        let geminiSuggestedCategories = [];
        if (GEMINI_API_KEY) { // Apenas chama a Gemini se a chave estiver disponível
            try {
                const geminiResponse = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: "Liste 10 categorias populares para cursos online, no formato JSON, como uma lista de strings, sem descrições ou textos adicionais. Exemplo: [\"Desenvolvimento Web\", \"Marketing Digital\"]"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 15000 // Aumenta o timeout para 15 segundos
                    }
                );

                const geminiText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
                if (geminiText) {
                    const jsonMatch = geminiText.match(/\[.*\]/s);
                    if (jsonMatch && jsonMatch[0]) {
                        try {
                            const parsedCategories = JSON.parse(jsonMatch[0]);
                            if (Array.isArray(parsedCategories)) {
                                geminiSuggestedCategories = parsedCategories.map(name => ({
                                    _id: `gemini-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`, // ID temporário para Gemini
                                    title: name
                                }));
                            }
                        } catch (parseError) {
                            console.error('Erro ao parsear JSON da Gemini para categorias:', parseError);
                        }
                    }
                }
            } catch (geminiError) {
                console.error('Erro ao chamar Gemini API para categorias:', geminiError.response?.data?.error || geminiError.message);
                // Continua mesmo se a Gemini API falhar
            }
        } else {
            console.warn("GEMINI_API_KEY não definida. Sugestões de categorias da Gemini serão ignoradas.");
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
            }
        });

        const finalCategories = Array.from(combinedCategoriesMap.values());

        res.status(200).json({ categories: finalCategories }); // Retorna um objeto com a chave 'categories'

    } catch (error) {
        console.error('Erro no controller getTopCategories:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar categorias combinadas.' });
    }
};

/**
 * @function getTopSubCategories
 * @description Retorna subcategorias combinando Sanity e Gemini, sem duplicatas.
 * @route GET /api/courses/create/top-subcategories
 * @access Protected
 * @param {string} req.query.categoryId - O ID da categoria selecionada.
 */
export const getTopSubCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    const { categoryId } = req.query;

    if (!categoryId) {
        return res.status(400).json({ message: 'ID da categoria é necessário para buscar subcategorias.' });
    }

    try {
        // 1. Buscar subcategorias existentes do Sanity para a categoria específica
        const sanitySubCategories = await sanityClient.fetch(`*[_type == "courseSubCategory" && parentCategory._ref == $categoryId] | order(title asc) {_id, title, "categoryRef": parentCategory._ref}`, { categoryId });

        // 2. Buscar 10 subcategorias populares da Gemini API
        let geminiSuggestedSubCategories = [];
        if (GEMINI_API_KEY) {
            try {
                const categoryTitle = await sanityClient.fetch(`*[_id == $categoryId][0].title`, { categoryId });

                const geminiResponse = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `Liste 10 subcategorias populares para cursos online na categoria "${categoryTitle || 'geral'}", no formato JSON, como uma lista de strings. Exemplo: [\"Front-end\", \"Back-end\", \"Mobile Development\"].`
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 15000
                    }
                );

                const geminiText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
                if (geminiText) {
                    const jsonMatch = geminiText.match(/\[.*\]/s);
                    if (jsonMatch && jsonMatch[0]) {
                        try {
                            const parsedSubCategories = JSON.parse(jsonMatch[0]);
                            if (Array.isArray(parsedSubCategories)) {
                                geminiSuggestedSubCategories = parsedSubCategories.map(name => ({
                                    _id: `gemini-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                                    title: name,
                                    categoryRef: categoryId // Anexa a categoria para consistência
                                }));
                            }
                        } catch (parseError) {
                            console.error('Erro ao parsear JSON da Gemini para subcategorias:', parseError);
                        }
                    }
                }
            } catch (geminiError) {
                console.error('Erro ao chamar Gemini API para subcategorias:', geminiError.response?.data?.error || geminiError.message);
            }
        } else {
            console.warn("GEMINI_API_KEY não definida. Sugestões de subcategorias da Gemini serão ignoradas.");
        }


        // 3. Combinar e remover duplicatas
        const combinedSubCategoriesMap = new Map();

        sanitySubCategories.forEach(subCat => {
            combinedSubCategoriesMap.set(subCat.title.toLowerCase(), subCat);
        });

        geminiSuggestedSubCategories.forEach(geminiSubCat => {
            if (!combinedSubCategoriesMap.has(geminiSubCat.title.toLowerCase())) {
                combinedSubCategoriesMap.set(geminiSubCat.title.toLowerCase(), geminiSubCat);
            }
        });

        const finalSubCategories = Array.from(combinedSubCategoriesMap.values());

        res.status(200).json({ subCategories: finalSubCategories }); // Retorna um objeto com a chave 'subCategories'

    } catch (error) {
        console.error('Erro no controller getTopSubCategories:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar subcategorias combinadas.' });
    }
};

/**
 * @function getTopTags
 * @description Retorna tags combinando Sanity e Gemini, sem duplicatas.
 * @route GET /api/courses/create/top-tags
 * @access Protected
 * @param {string} req.query.categoryId - O ID da categoria selecionada.
 * @param {string} req.query.subCategoryId - O ID da subcategoria selecionada.
 */
export const getTopTags = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    const { categoryId, subCategoryId } = req.query;

    if (!categoryId || !subCategoryId) {
        return res.status(400).json({ message: 'IDs de categoria e subcategoria são obrigatórios para buscar tags.' });
    }

    try {
        // 1. Buscar tags existentes do Sanity para a categoria e subcategoria específicas
        // Ajuste a query GROQ para refletir seu schema de courseTag
        const sanityTags = await sanityClient.fetch(`*[_type == "courseTag" && $categoryId in categories[]._ref && $subCategoryId in subCategories[]._ref] | order(name asc) {_id, name}`, { categoryId, subCategoryId });

        // 2. Buscar 10 tags populares da Gemini API
        let geminiSuggestedTags = [];
        if (GEMINI_API_KEY) {
            try {
                const categoryTitle = await sanityClient.fetch(`*[_id == $categoryId][0].title`, { categoryId });
                const subCategoryTitle = await sanityClient.fetch(`*[_id == $subCategoryId][0].title`, { subCategoryId });

                const geminiResponse = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `Liste 10 tags populares para cursos online na categoria "${categoryTitle || 'geral'}" e subcategoria "${subCategoryTitle || 'geral'}", no formato JSON, como uma lista de strings. Exemplo: [\"JavaScript\", \"React\", \"Node.js\"].`
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 15000
                    }
                );

                const geminiText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text;
                if (geminiText) {
                    const jsonMatch = geminiText.match(/\[.*\]/s);
                    if (jsonMatch && jsonMatch[0]) {
                        try {
                            const parsedTags = JSON.parse(jsonMatch[0]);
                            if (Array.isArray(parsedTags)) {
                                geminiSuggestedTags = parsedTags.map(name => ({
                                    _id: `gemini-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                                    name: name
                                }));
                            }
                        } catch (parseError) {
                            console.error('Erro ao parsear JSON da Gemini para tags:', parseError);
                        }
                    }
                }
            } catch (geminiError) {
                console.error('Erro ao chamar Gemini API para tags:', geminiError.response?.data?.error || geminiError.message);
            }
        } else {
            console.warn("GEMINI_API_KEY não definida. Sugestões de tags da Gemini serão ignoradas.");
        }


        // 3. Combinar e remover duplicatas
        const combinedTagsMap = new Map();

        sanityTags.forEach(tag => {
            combinedTagsMap.set(tag.name.toLowerCase(), tag);
        });

        geminiSuggestedTags.forEach(geminiTag => {
            if (!combinedTagsMap.has(geminiTag.name.toLowerCase())) {
                combinedTagsMap.set(geminiTag.name.toLowerCase(), geminiTag);
            }
        });

        const finalTags = Array.from(combinedTagsMap.values());

        res.status(200).json({ tags: finalTags }); // Retorna um objeto com a chave 'tags'

    } catch (error) {
        console.error('Erro no controller getTopTags:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tags combinadas.', error: error.message });
    }
};