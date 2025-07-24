// D:\meuscursos\backend\controllers\subcategoryController.js

import axios from 'axios';
import sanityClient from '../utils/sanityClient.js'; // Importa o cliente Sanity
import { GEMINI_API_KEY, GEMINI_MODEL, parseGeminiResponse } from '../utils/geminiUtils.js'; // Importa utilidades Gemini
import { generateSlug } from '../utils/slugGenerator.js'; // Importa o gerador de slug

// --- Variáveis para Cache da Gemini Subcategories ---
let cachedGeminiSubcategories = {}; // Objeto para armazenar cache por categoryId
const GEMINI_SUBCATEGORY_CACHE_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 horas
let geminiSubcategoryCacheTimestamps = {}; // Objeto para armazenar timestamps por categoryId

// Função para buscar subcategorias com base na categoria pai
export const getSubcategories = async (req, res) => {
    const { categoryId, categoryName } = req.query; // Recebe o ID e o nome da categoria pai

    if (!categoryId) {
        return res.status(400).json({ message: 'ID da categoria é obrigatório para buscar subcategorias.' });
    }

    let sanitySubcategories = [];
    let geminiSuggestedSubcategories = [];
    let geminiErrorFlag = false;

    // 1. Buscar Subcategorias do Sanity (filtradas pela categoria pai)
    try {
        // Query para buscar subcategorias que referenciam a categoryId
        const query = `*[_type == "courseSubCategory" && parentCategory._ref == $categoryId]{_id, title, parentCategory->{_id, title}}`;
        const rawSanitySubcategories = await sanityClient.fetch(query, { categoryId });
        
        sanitySubcategories = rawSanitySubcategories.filter(subCat => 
            subCat && typeof subCat._id === 'string' && typeof subCat.title === 'string' && subCat.title.trim() !== ''
        ).map(subCat => ({
            _id: subCat._id,
            name: subCat.title, // Mapeia 'title' para 'name'
            parentCategoryId: subCat.parentCategory._id,
            parentCategoryName: subCat.parentCategory.title
        }));
        
        console.log(`[Backend] Buscadas ${sanitySubcategories.length} subcategorias válidas do Sanity para a categoria "${categoryName || categoryId}".`);
    } catch (error) {
        console.error(`Erro ao buscar subcategorias do Sanity para ${categoryId}:`, error.message);
    }

    // 2. Buscar Subcategorias da Gemini (com cache)
    if (!GEMINI_API_KEY) {
        console.warn("[Backend] GEMINI_API_KEY não configurada. Não será possível gerar subcategorias com Gemini.");
        geminiErrorFlag = true;
    } else {
        const now = Date.now();
        const cacheKey = categoryId; // Usa o ID da categoria como chave de cache
        
        if (cachedGeminiSubcategories[cacheKey] && (now - geminiSubcategoryCacheTimestamps[cacheKey] < GEMINI_SUBCATEGORY_CACHE_LIFETIME_MS)) {
            console.log(`[Backend] Servindo subcategorias da Gemini do cache para "${categoryName || categoryId}".`);
            geminiSuggestedSubcategories = cachedGeminiSubcategories[cacheKey];
        } else {
            console.log(`[Backend] Cache de subcategorias Gemini expirado ou não definido para "${categoryName || categoryId}". Chamando Gemini API...`);
            try {
                const geminiPrompt = `Liste 10 subcategorias populares e em alta demanda para a categoria principal "${categoryName || 'geral'}". Responda APENAS com uma lista JSON de strings, sem descrições ou textos adicionais, sem markdown. Exemplo para "Tecnologia": ["Desenvolvimento Web", "Inteligência Artificial", "Cibersegurança"]`;

                const geminiResponse = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
                    { contents: [{ parts: [{ text: geminiPrompt }] }] },
                    { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
                );

                const suggestedNames = parseGeminiResponse(geminiResponse);
                geminiSuggestedSubcategories = suggestedNames
                    .filter(name => typeof name === 'string' && name.trim() !== '')
                    .map(name => ({
                        // Gera um ID Gemini que inclui o slug da categoria pai para unicidade
                        _id: `gemini-sub-${generateSlug(categoryName, name)}-${categoryId}`, 
                        name: name,
                        parentCategoryId: categoryId,
                        parentCategoryName: categoryName
                    }));

                cachedGeminiSubcategories[cacheKey] = geminiSuggestedSubcategories;
                geminiSubcategoryCacheTimestamps[cacheKey] = now;
                console.log(`[Backend] Geradas e cacheadas ${geminiSuggestedSubcategories.length} subcategorias da Gemini para "${categoryName || categoryId}".`);

            } catch (geminiError) {
                console.error(`Erro ao chamar Gemini API para subcategorias de "${categoryName || categoryId}":`, geminiError.response?.data || geminiError.message);
                geminiErrorFlag = true;

                if (cachedGeminiSubcategories[cacheKey]) {
                    console.warn("[Backend] Gemini API call failed, serving stale subcategory cache if available.");
                    geminiSuggestedSubcategories = cachedGeminiSubcategories[cacheKey];
                } else {
                    console.warn("[Backend] Gemini API call failed and no subcategory cache available. Gemini subcategories will be empty.");
                    geminiSuggestedSubcategories = [];
                }
            }
        }
    }

    // 3. Combinar, Remover Duplicatas e Ordenar
    const combinedSubcategoriesMap = new Map();

    // Adiciona subcategorias do Sanity (prioridade)
    sanitySubcategories.forEach(subCat => {
        if (subCat && typeof subCat.name === 'string' && subCat.name.trim() !== '') {
            const normalizedName = subCat.name.toLowerCase();
            combinedSubcategoriesMap.set(normalizedName, subCat);
        }
    });

    // Adiciona subcategorias sugeridas pela Gemini se não existirem já pelo nome
    geminiSuggestedSubcategories.forEach(subCat => {
        if (subCat && typeof subCat.name === 'string' && subCat.name.trim() !== '') { 
            const normalizedName = subCat.name.toLowerCase();
            if (!combinedSubcategoriesMap.has(normalizedName)) {
                combinedSubcategoriesMap.set(normalizedName, subCat);
            }
        }
    });

    const finalSubcategories = Array.from(combinedSubcategoriesMap.values());
    finalSubcategories.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[Backend] Total de ${finalSubcategories.length} subcategorias combinadas para "${categoryName || categoryId}" (Sanity + Gemini).`);
    
    res.status(200).json({ 
        subcategories: finalSubcategories,
        geminiQuotaExceeded: geminiErrorFlag 
    });
};

// Função para criar uma nova subcategoria no Sanity
export const createSubcategory = async (req, res) => {
    const { title, parentCategoryId, parentCategoryName } = req.body; 

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'O título da subcategoria é obrigatório e deve ser uma string não vazia.' });
    }
    if (!parentCategoryId || typeof parentCategoryId !== 'string' || parentCategoryId.trim() === '') {
        return res.status(400).json({ message: 'O ID da categoria pai é obrigatório para criar uma subcategoria.' });
    }
    if (!parentCategoryName || typeof parentCategoryName !== 'string' || parentCategoryName.trim() === '') {
        return res.status(400).json({ message: 'O nome da categoria pai é obrigatório para criar uma subcategoria.' });
    }

    let finalParentCategoryId = parentCategoryId;
    let finalParentCategoryName = parentCategoryName;
    let parentCategorySlug = null; // NOVO: Para armazenar o slug da categoria pai

    // VERIFICAÇÃO E CRIAÇÃO DA CATEGORIA PAI SE NECESSÁRIO
    if (parentCategoryId.startsWith('gemini-')) {
        try {
            const existingSanityCategory = await sanityClient.fetch(
                `*[_type == "courseCategory" && title == $title][0]`, 
                { title: parentCategoryName }
            );

            if (existingSanityCategory) {
                finalParentCategoryId = existingSanityCategory._id;
                finalParentCategoryName = existingSanityCategory.title;
                parentCategorySlug = existingSanityCategory.slug.current; // Obtém o slug existente
                console.log(`[Backend] Categoria Gemini "${parentCategoryName}" já existe no Sanity com ID: ${finalParentCategoryId}. Usando existente.`);
            } else {
                const categorySlug = generateSlug(parentCategoryName); 
                const newCategoryDoc = {
                    _type: 'courseCategory',
                    title: parentCategoryName.trim(),
                    slug: {
                        _type: 'slug',
                        current: categorySlug
                    }
                };
                const createdCategory = await sanityClient.create(newCategoryDoc);
                finalParentCategoryId = createdCategory._id;
                finalParentCategoryName = createdCategory.title;
                parentCategorySlug = createdCategory.slug.current; // Obtém o slug da categoria recém-criada
                console.log(`[Backend] Categoria Gemini "${parentCategoryName}" criada no Sanity com ID: ${finalParentCategoryId}.`);
                
                // Invalida o cache de categorias
                // (Isso será tratado no categoryController, mas é um ponto a considerar para a refatoração.)
            }
        } catch (error) {
            console.error('Erro ao verificar/criar categoria pai no Sanity para subcategoria:', error.message);
            return res.status(500).json({ message: 'Erro interno ao processar a categoria pai para subcategoria.', error: error.message });
        }
    } else {
        // Se não é um ID Gemini, assume que é um ID Sanity real. Busca o slug.
        try {
            const parentCat = await sanityClient.fetch(`*[_id == $parentCategoryId][0]{title, slug}`, { parentCategoryId });
            if (parentCat) {
                if (parentCat.title !== finalParentCategoryName) {
                    console.warn(`[Backend] Nome da categoria pai (${finalParentCategoryName}) difere do Sanity (${parentCat.title}) para ID ${parentCategoryId}. Usando nome do Sanity.`);
                    finalParentCategoryName = parentCat.title;
                }
                parentCategorySlug = parentCat.slug.current; // Obtém o slug da categoria existente
            } else {
                console.warn(`[Backend] Categoria pai com ID "${parentCategoryId}" não encontrada no Sanity.`);
                return res.status(400).json({ message: `Categoria pai com ID "${parentCategoryId}" não encontrada.` });
            }
        } catch (error) {
            console.error('Erro ao buscar nome/slug da categoria pai no Sanity para subcategoria:', error.message);
            return res.status(500).json({ message: 'Erro interno ao verificar a categoria pai para subcategoria.', error: error.message });
        }
    }

    // Verificar se a subcategoria já existe para esta categoria pai (usando o ID final)
    try {
        const existingSubcategory = await sanityClient.fetch(`*[_type == "courseSubCategory" && title == $title && parentCategory._ref == $finalParentCategoryId][0]`, { title, finalParentCategoryId });
        if (existingSubcategory) {
            return res.status(409).json({ message: 'Esta subcategoria já existe para esta categoria principal.' });
        }
    } catch (error) {
        console.error('Erro ao verificar subcategoria existente no Sanity:', error.message);
    }

    // NOVO: Geração do slug hierárquico
    const slugValue = generateSlug(parentCategorySlug, title); 

    const newSubcategoryDoc = {
        _type: 'courseSubCategory',
        title: title.trim(),
        slug: {
            _type: 'slug',
            current: slugValue
        },
        parentCategory: {
            _type: 'reference',
            _ref: finalParentCategoryId // Usa o ID final (Sanity ou recém-criado)
        }
    };

    try {
        const createdDoc = await sanityClient.create(newSubcategoryDoc);
        console.log(`[Backend] Subcategoria "${createdDoc.title}" criada no Sanity com ID: ${createdDoc._id}, Slug: ${createdDoc.slug.current}, Categoria Pai (Final): ${finalParentCategoryId}`);
        
        // Invalida o cache de subcategorias para a categoria pai específica
        delete cachedGeminiSubcategories[finalParentCategoryId];
        delete geminiSubcategoryCacheTimestamps[finalParentCategoryId];

        // Retorna a subcategoria criada no formato que o frontend espera (_id, name, parentCategoryId, parentCategoryName)
        res.status(201).json({ 
            _id: createdDoc._id, 
            name: createdDoc.title,
            parentCategoryId: createdDoc.parentCategory._ref,
            parentCategoryName: finalParentCategoryName // Retorna o nome final da categoria pai
        });

    } catch (error) {
        console.error('Erro ao criar subcategoria no Sanity:', error.message);
        res.status(500).json({ message: 'Erro ao criar subcategoria no Sanity.', error: error.message });
    }
};
