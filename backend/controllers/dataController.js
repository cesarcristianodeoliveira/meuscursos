// D:\meuscursos\backend\controllers\dataController.js
import { createClient } from '@sanity/client';

// Replicar a configuração do Sanity Client aqui ou importá-la de um arquivo de configuração central
// Idealmente, você teria um './config/sanity.js' exportando o client
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em dataController.");
    // Em produção, você pode querer lançar um erro ou ter um fallback
}

// O apiVersion pode ser '2021-03-25' para a maioria dos projetos existentes,
// '2023-08-01' para funcionalidades mais recentes, ou a data atual se for um projeto novo.
// Usar uma data futura como 2025-06-12 é ok, mas geralmente usamos a data de lançamento da API que queremos fixar.
const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12', // Mantendo sua versão, apenas uma nota.
    useCdn: false, // Use false para writes/updates
    token: process.env.SANITY_TOKEN,
}) : null;

// Função para buscar todas as categorias de cursos
export const getCourseCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        // Query Sanity para buscar todos os documentos do tipo 'courseCategory'
        // Adicionada ordenação alfabética pelo título
        const query = `*[_type == "courseCategory"] | order(title asc) {_id, title, description}`;
        const categories = await sanityClient.fetch(query);
        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao buscar categorias do Sanity:", error);
        res.status(500).json({ error: 'Erro ao buscar categorias de cursos.', details: error.message });
    }
};

// Função para buscar todas as subcategorias de cursos
export const getCourseSubCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        // Query Sanity para buscar todos os documentos do tipo 'courseSubCategory'
        // CORREÇÃO: Usando 'parentCategory._ref' para acessar a referência da categoria pai
        // Adicionada ordenação alfabética pelo título
        const query = `*[_type == "courseSubCategory"] | order(title asc) {_id, title, description, "categoryRef": parentCategory._ref}`;
        const subCategories = await sanityClient.fetch(query);
        res.status(200).json(subCategories);
    } catch (error) {
        console.error("Erro ao buscar subcategorias do Sanity:", error);
        res.status(500).json({ error: 'Erro ao buscar subcategorias de cursos.', details: error.message });
    }
};

/**
 * @desc Busca tags de curso por ID de categoria associada.
 * @route GET /api/data/tags/byCategory/:categoryId
 * @access Public (para listar opções no frontend)
 */
export const getCourseTagsByCategory = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        const { categoryId } = req.params;

        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required.' });
        }

        // Busca todas as tags que têm uma referência ao categoryId no array 'categories'
        // 'categories' é o campo array de referências no seu schema courseTag
        // Adicionada ordenação alfabética pelo nome
        const tags = await sanityClient.fetch(
            `*[_type == "courseTag" && $categoryId in categories[]._ref] | order(name asc) {
                _id,
                name,
                slug,
                description
            }`,
            { categoryId }
        );

        res.status(200).json(tags);

    } catch (error) {
        console.error('Erro ao buscar tags por categoria:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar tags.', error: error.message });
    }
};