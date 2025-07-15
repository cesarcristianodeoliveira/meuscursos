// D:\meuscursos\backend\controllers\dataController.js
import { createClient } from '@sanity/client';
import dotenv from 'dotenv'; // Importar dotenv aqui também por segurança
dotenv.config();

// --- Configuração do Sanity Client para LEITURA ---
// NOTA: Para escritas, useCdn deve ser 'false'.
// Aqui, para buscar dados, 'true' é geralmente melhor para performance.
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em dataController.");
    // Em um ambiente de produção real, você pode querer lançar um erro fatal aqui
    // throw new Error("SANITY_PROJECT_ID or SANITY_TOKEN not defined.");
}

const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12', // Mantendo sua versão
    useCdn: true, // Usar CDN para leituras (melhora performance)
    token: process.env.SANITY_TOKEN, // Token para acesso a rascunhos ou dados privados, se necessário
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

        // Busca todas as tags que têm uma referência ao categoryId no array 'categories'
        // 'categories' é o campo array de referências no seu schema courseTag
        const tags = await sanityClient.fetch(
            `*[_type == "courseTag" && $categoryId in categories[]._ref] | order(name asc) {
                name // Apenas o nome da tag
            }`,
            { categoryId }
        );

        // Mapeia o resultado para retornar apenas um array de strings (nomes das tags)
        const tagNames = tags.map(tag => tag.name);

        res.status(200).json(tagNames); // Retorna array de strings
    } catch (error) {
        console.error('Erro ao buscar tags por categoria:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tags por categoria.', error: error.message });
    }
};