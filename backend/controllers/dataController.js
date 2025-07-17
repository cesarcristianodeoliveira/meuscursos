// D:\meuscursos\backend\controllers\dataController.js
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
dotenv.config();

// --- Configuração do Sanity Client para LEITURA ---
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em dataController.");
}

const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12', // Mantendo sua versão
    useCdn: true, // Usar CDN para leituras (melhora performance)
    token: process.env.SANITY_TOKEN, // Seu token é necessário mesmo para leituras se o dataset for privado
}) : null;

// --- Funções do Controlador de Dados ---

/**
 * @function getCourseCategories
 * @description Retorna todas as categorias de cursos do Sanity CMS.
 * @route GET /api/data/categories
 * @access Public
 */
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

/**
 * @function getCourseSubCategories
 * @description Retorna todas as subcategorias de cursos do Sanity CMS, com referência à categoria pai.
 * @route GET /api/data/subcategories
 * @access Public
 */
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

/**
 * @function getCourseTagsByCategory
 * @description Busca tags existentes do Sanity CMS associadas a uma categoria específica.
 * @route GET /api/data/tags/byCategory/:categoryId
 * @access Public
 * @returns {Array<string>} Retorna um array de strings com os nomes das tags.
 */
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
            `*[_type == "courseTag" && $categoryId in categories[]._ref] | order(name asc) {
                name
            }`,
            { categoryId }
        );

        const tagNames = tags.map(tag => tag.name);

        res.status(200).json(tagNames); // Retorna um ARRAY de strings como esperado
    } catch (error) {
        console.error('Erro ao buscar tags por categoria:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tags por categoria.', error: error.message });
    }
};

/**
 * @function getAllTags
 * @description Retorna TODAS as tags de cursos do Sanity CMS, opcionalmente filtradas por categoria.
 * @route GET /api/data/tags
 * @access Public
 * @param {string} [req.query.categoryId] - Opcional. ID da categoria para filtrar as tags.
 * @returns {Array<Object>} Retorna um array de objetos de tags (ex: {_id: '...', name: '...'}).
 */
export const getAllTags = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const { categoryId } = req.query; // Captura o categoryId da query string

        let query;
        let params = {};

        if (categoryId) {
            query = `*[_type == "courseTag" && $categoryId in categories[]._ref] | order(name asc) {
                _id,
                name
            }`;
            params = { categoryId };
            console.log(`[BACKEND - getAllTags] Buscando tags para a categoria: ${categoryId}`);
        } else {
            query = `*[_type == "courseTag"] | order(name asc) {
                _id,
                name
            }`;
            console.log("[BACKEND - getAllTags] Buscando todas as tags.");
        }

        const tags = await sanityClient.fetch(query, params);

        res.status(200).json(tags); // Retorna um ARRAY de objetos como esperado
    } catch (error) {
        console.error("Erro ao buscar tags do Sanity (getAllTags):", error);
        res.status(500).json({ error: 'Erro ao buscar tags de cursos.', details: error.message });
    }
};


/**
 * @function getTopCategories
 * @description Retorna as 10 categorias de cursos mais procuradas do Sanity CMS.
 * Atualmente, busca todas e limita, idealmente seria um campo de popularidade.
 * @route GET /api/courses/create/top-categories
 * @access Protected
 */
export const getTopCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        // ASSUNÇÃO: Se você tiver um campo de "popularidade" ou "contador de buscas" no schema courseCategory,
        // você pode ordenar por ele para ter categorias realmente "mais procuradas".
        // Ex: `*[_type == "courseCategory"] | order(popularity desc) [0...10] {_id, title}`
        const query = `*[_type == "courseCategory"] | order(title asc) [0...10] {_id, title}`;
        const categories = await sanityClient.fetch(query);
        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao buscar as 10 categorias mais procuradas do Sanity:", error);
        res.status(500).json({ error: 'Erro ao buscar as categorias mais procuradas.', details: error.message });
    }
};

/**
 * @function getTopSubCategories
 * @description Retorna as 10 subcategorias mais procuradas para uma categoria específica do Sanity CMS.
 * Atualmente, busca todas relacionadas à categoria e limita.
 * @route GET /api/courses/create/top-subcategories
 * @access Protected
 * @param {string} req.query.categoryId - O ID da categoria selecionada.
 */
export const getTopSubCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const { categoryId } = req.query;

        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID é obrigatório para buscar subcategorias.' });
        }

        // ASSUNÇÃO: Similar às categorias, se houver um campo de popularidade em courseSubCategory,
        // use-o para ordenar. Caso contrário, ordem alfabética e limite.
        const query = `*[_type == "courseSubCategory" && parentCategory._ref == $categoryId] | order(title asc) [0...10] {_id, title, "categoryRef": parentCategory._ref}`;
        const subCategories = await sanityClient.fetch(query, { categoryId });
        res.status(200).json(subCategories);
    } catch (error) {
        console.error("Erro ao buscar as 10 subcategorias mais procuradas do Sanity:", error);
        res.status(500).json({ error: 'Erro ao buscar as subcategorias mais procuradas.', details: error.message });
    }
};

/**
 * @function getTopTags
 * @description Retorna as 10 tags mais procuradas relacionadas a uma categoria e subcategoria.
 * Prioriza tags com base em referências e limita a 10.
 * @route GET /api/courses/create/top-tags
 * @access Protected
 * @param {string} req.query.categoryId - O ID da categoria selecionada.
 * @param {string} req.query.subCategoryId - O ID da subcategoria selecionada.
 * @returns {Array<string>} Retorna um array de strings com os nomes das tags.
 */
export const getTopTags = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const { categoryId, subCategoryId } = req.query;

        if (!categoryId || !subCategoryId) {
            return res.status(400).json({ message: 'Category ID e Subcategory ID são obrigatórios para buscar tags.' });
        }

        // Esta query busca tags que estejam associadas à CATEGORIA E (opcionalmente) à SUBCATEGORIA.
        // Se suas tags no Sanity tiverem um campo para popularidade ou se forem referenciadas por muitos cursos,
        // você pode usar essa informação para ordenar. Aqui, estamos buscando por relevância e limitando.
        const query = `
            *[_type == "courseTag" && $categoryId in categories[]._ref && $subCategoryId in subCategories[]._ref]
            | order(name asc) [0...10] {
                name
            }
        `;
        const tags = await sanityClient.fetch(query, { categoryId, subCategoryId });

        const tagNames = tags.map(tag => tag.name);
        res.status(200).json(tagNames);
    } catch (error) {
        console.error('Erro ao buscar as 10 tags mais procuradas:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar as tags mais procuradas.', error: error.message });
    }
};