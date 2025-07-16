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
    useCdn: false, // Usar CDN para leituras (melhora performance), embora para escritas deva ser 'false'.
    token: process.env.SANITY_TOKEN, 
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
                name // Apenas o nome da tag
            }`,
            { categoryId }
        );

        const tagNames = tags.map(tag => tag.name);

        res.status(200).json(tagNames);
    } catch (error) {
        console.error('Erro ao buscar tags por categoria:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tags por categoria.', error: error.message });
    }
};

// --- NOVA FUNÇÃO: getAllTags --- // <-- Apenas um comentário válido
/**
 * @function getAllTags
 * @description Retorna TODAS as tags de cursos do Sanity CMS.
 * @route GET /api/data/tags
 * @access Public
 * @returns {Array<Object>} Retorna um array de objetos de tags (ex: {_id: '...', title: '...'}).
 */
export const getAllTags = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        // Query GROQ para buscar todos os documentos do tipo 'courseTag'
        // Ordena por 'name' (já que seu schema usa 'name') e retorna o _id e o campo 'name'
        const query = `*[_type == "courseTag"] | order(name asc) {
            _id, 
            name // Usando 'name' de acordo com seu schema courseTag.js
        }`;
        const tags = await sanityClient.fetch(query);
        
        res.status(200).json(tags);
    } catch (error) {
        console.error("Erro ao buscar todas as tags do Sanity:", error);
        res.status(500).json({ error: 'Erro ao buscar todas as tags de cursos.', details: error.message });
    }
};

// Se você tiver uma linha de exportação única no final, ela deve incluir getAllTags:
// export { getCourseCategories, getCourseSubCategories, getCourseTagsByCategory, getAllTags };