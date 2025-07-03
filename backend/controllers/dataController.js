// D:\meuscursos\backend\controllers\dataController.js
import { createClient } from '@sanity/client';

// Replicar a configuração do Sanity Client aqui ou importá-la de um arquivo de configuração central
// Idealmente, você teria um './config/sanity.js' exportando o client
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em dataController.");
    // Em produção, você pode querer lançar um erro ou ter um fallback
}
const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12', // Certifique-se de que esta API version está atualizada ou corresponde à que você está usando
    useCdn: false,
    token: process.env.SANITY_TOKEN,
}) : null;

// Função para buscar todas as categorias de cursos
export const getCourseCategories = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Configuração do Sanity Client indisponível.' });
    }
    try {
        // Query Sanity para buscar todos os documentos do tipo 'courseCategory'
        const query = `*[_type == "courseCategory"]{_id, title, description}`;
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
        const query = `*[_type == "courseSubCategory"]{_id, title, description, "categoryRef": parentCategory._ref}`;
        const subCategories = await sanityClient.fetch(query);
        res.status(200).json(subCategories);
    } catch (error) {
        console.error("Erro ao buscar subcategorias do Sanity:", error);
        res.status(500).json({ error: 'Erro ao buscar subcategorias de cursos.', details: error.message });
    }
};

// Se você precisar de tags ou outros dados de referência, adicione funções aqui
// export const getCourseTags = async (req, res) => { ... }