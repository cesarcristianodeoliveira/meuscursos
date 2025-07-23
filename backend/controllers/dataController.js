// D:\meuscursos\backend\controllers\dataController.js

import axios from 'axios';
import { createClient } from '@sanity/client'; // Importa o cliente Sanity

// --- Configurações da Gemini API ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

// --- Configurações da Pixabay API ---
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const PIXABAY_BASE_URL = 'https://pixabay.com/api/';

// --- Variáveis para Cache da Gemini Categories, Subcategories e Tags ---
let cachedGeminiCategories = null;
const GEMINI_CATEGORY_CACHE_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
let geminiCategoryCacheTimestamp = 0;

let cachedGeminiSubcategories = {}; // Objeto para armazenar cache por categoryId
const GEMINI_SUBCATEGORY_CACHE_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 horas
let geminiSubcategoryCacheTimestamps = {}; // Objeto para armazenar timestamps por categoryId

// Cache para tags (pode ser mais granular por subcategoria/categoria)
let cachedGeminiTags = {}; // Objeto para armazenar cache por subcategoryId ou categoryId
const GEMINI_TAG_CACHE_LIFETIME_MS = 6 * 60 * 60 * 1000; // 6 horas
let geminiTagCacheTimestamps = {}; // Objeto para armazenar timestamps por cacheKey

// Cache para Imagens Pixabay
let cachedPixabayImages = {}; // Objeto para armazenar cache por termo de busca
const PIXABAY_IMAGE_CACHE_LIFETIME_MS = 2 * 60 * 60 * 1000; // 2 horas
let pixabayImageCacheTimestamps = {}; // Objeto para armazenar timestamps por termo de busca

// --- Configurações do Sanity Client ---
const sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: process.env.SANITY_API_VERSION || '2023-05-03', // Use a API version mais recente ou a sua
    token: process.env.SANITY_TOKEN, // O token é NECESSÁRIO para operações de ESCRITA
    useCdn: false, // Para escrita, é melhor não usar CDN para garantir que a escrita vá para o ponto de origem
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
    let geminiErrorFlag = false; // Flag para indicar erro na Gemini

    // 1. Buscar Categorias do Sanity
    try {
        const query = `*[_type == "courseCategory"]{_id, title}`; // Usando 'title' como no seu schema
        const rawSanityCategories = await sanityClient.fetch(query);
        
        sanityCategories = rawSanityCategories.filter(cat => 
            cat && typeof cat._id === 'string' && typeof cat.title === 'string' && cat.title.trim() !== ''
        ).map(cat => ({
            _id: cat._id,
            name: cat.title // Mapeia 'title' do Sanity para 'name'
        }));
        
        console.log(`[Backend] Buscadas ${sanityCategories.length} categorias válidas do Sanity.`);
    } catch (error) {
        console.error('Erro ao buscar categorias do Sanity:', error.message);
        // Não falha a requisição inteira se o Sanity falhar
    }

    // 2. Buscar Categorias da Gemini (com cache)
    if (!GEMINI_API_KEY) {
        console.warn("[Backend] GEMINI_API_KEY não configurada. Não será possível gerar categorias com Gemini.");
        geminiErrorFlag = true; // Marca que a Gemini não pôde ser usada
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
                geminiSuggestedCategories = suggestedNames
                    .filter(name => typeof name === 'string' && name.trim() !== '')
                    .map(name => ({
                        _id: `gemini-${name.toLowerCase().replace(/\s/g, '-')}`,
                        name: name
                    }));

                cachedGeminiCategories = geminiSuggestedCategories;
                geminiCategoryCacheTimestamp = now;
                console.log(`[Backend] Geradas e cacheadas ${geminiSuggestedCategories.length} categorias da Gemini.`);

            } catch (geminiError) {
                console.error('Erro ao chamar Gemini API para categorias:', geminiError.response?.data || geminiError.message);
                geminiErrorFlag = true; // Marca que houve um erro na Gemini

                if (cachedGeminiCategories) {
                    console.warn("[Backend] Gemini API call failed, serving stale cache if available.");
                    geminiSuggestedCategories = cachedGeminiCategories; // Serve o cache antigo
                } else {
                    console.warn("[Backend] Gemini API call failed and no cache available. Gemini categories will be empty.");
                    geminiSuggestedCategories = []; // Garante que é um array vazio se não houver cache
                }
            }
        }
    }

    // 3. Combinar, Remover Duplicatas e Ordenar
    const combinedCategoriesMap = new Map();

    // Adiciona categorias do Sanity (prioridade)
    sanityCategories.forEach(cat => {
        if (cat && typeof cat.name === 'string' && cat.name.trim() !== '') {
            const normalizedName = cat.name.toLowerCase();
            combinedCategoriesMap.set(normalizedName, { _id: cat._id, name: cat.name });
        }
    });

    // Adiciona categorias sugeridas pela Gemini se não existirem já pelo nome
    geminiSuggestedCategories.forEach(cat => {
        if (cat && typeof cat.name === 'string' && cat.name.trim() !== '') { 
            const normalizedName = cat.name.toLowerCase();
            if (!combinedCategoriesMap.has(normalizedName)) {
                combinedCategoriesMap.set(normalizedName, cat);
            }
        }
    });

    const finalCategories = Array.from(combinedCategoriesMap.values());
    finalCategories.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[Backend] Total de ${finalCategories.length} categorias combinadas (Sanity + Gemini).`);
    
    res.status(200).json({ 
        categories: finalCategories,
        geminiQuotaExceeded: geminiErrorFlag 
    });
};

// Função para criar uma nova categoria no Sanity
export const createCategory = async (req, res) => {
    const { title } = req.body; // Espera receber 'title' do frontend

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'O título da categoria é obrigatório e deve ser uma string não vazia.' });
    }

    // Opcional: Verificar se a categoria já existe para evitar duplicatas
    try {
        const existingCategory = await sanityClient.fetch(`*[_type == "courseCategory" && title == $title][0]`, { title });
        if (existingCategory) {
            return res.status(409).json({ message: 'Esta categoria já existe.' });
        }
    } catch (error) {
        console.error('Erro ao verificar categoria existente no Sanity:', error.message);
        // Continua mesmo com erro na verificação para não bloquear a criação
    }

    // Geração do slug a partir do título
    const slugValue = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const newCategoryDoc = {
        _type: 'courseCategory',
        title: title.trim(),
        slug: {
            _type: 'slug',
            current: slugValue
        }
    };

    try {
        const createdDoc = await sanityClient.create(newCategoryDoc);
        console.log(`[Backend] Categoria "${createdDoc.title}" criada no Sanity com ID: ${createdDoc._id}, Slug: ${createdDoc.slug.current}`);
        
        // Invalida o cache da Gemini para que a próxima requisição busque a nova categoria
        cachedGeminiCategories = null; 
        geminiCategoryCacheTimestamp = 0;

        // Retorna a categoria criada no formato que o frontend espera (_id, name)
        res.status(201).json({ _id: createdDoc._id, name: createdDoc.title });

    } catch (error) {
        console.error('Erro ao criar categoria no Sanity:', error.message);
        res.status(500).json({ message: 'Erro ao criar categoria no Sanity.', error: error.message });
    }
};

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
                        _id: `gemini-sub-${name.toLowerCase().replace(/\s/g, '-')}-${categoryId}`, // ID único para subcategorias Gemini
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
    const { title, parentCategoryId } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'O título da subcategoria é obrigatório e deve ser uma string não vazia.' });
    }
    if (!parentCategoryId || typeof parentCategoryId !== 'string' || parentCategoryId.trim() === '') {
        return res.status(400).json({ message: 'O ID da categoria pai é obrigatório para criar uma subcategoria.' });
    }

    // Opcional: Verificar se a subcategoria já existe para esta categoria pai
    try {
        const existingSubcategory = await sanityClient.fetch(`*[_type == "courseSubCategory" && title == $title && parentCategory._ref == $parentCategoryId][0]`, { title, parentCategoryId });
        if (existingSubcategory) {
            return res.status(409).json({ message: 'Esta subcategoria já existe para esta categoria principal.' });
        }
    } catch (error) {
        console.error('Erro ao verificar subcategoria existente no Sanity:', error.message);
    }

    const slugValue = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const newSubcategoryDoc = {
        _type: 'courseSubCategory',
        title: title.trim(),
        slug: {
            _type: 'slug',
            current: slugValue
        },
        parentCategory: {
            _type: 'reference',
            _ref: parentCategoryId // A referência está sendo criada aqui
        }
    };

    try {
        const createdDoc = await sanityClient.create(newSubcategoryDoc);
        console.log(`[Backend] Subcategoria "${createdDoc.title}" criada no Sanity com ID: ${createdDoc._id}, Slug: ${createdDoc.slug.current}, Categoria Pai: ${parentCategoryId}`);
        
        // Invalida o cache de subcategorias para a categoria pai específica
        delete cachedGeminiSubcategories[parentCategoryId];
        delete geminiSubcategoryCacheTimestamps[parentCategoryId];

        // Retorna a subcategoria criada no formato que o frontend espera (_id, name, parentCategoryId, parentCategoryName)
        // Precisamos buscar o nome da categoria pai para retornar completo
        const parentCat = await sanityClient.fetch(`*[_id == $parentCategoryId][0]{title}`, { parentCategoryId });

        res.status(201).json({ 
            _id: createdDoc._id, 
            name: createdDoc.title,
            parentCategoryId: createdDoc.parentCategory._ref,
            parentCategoryName: parentCat ? parentCat.title : 'Desconhecida'
        });

    } catch (error) {
        console.error('Erro ao criar subcategoria no Sanity:', error.message);
        res.status(500).json({ message: 'Erro ao criar subcategoria no Sanity.', error: error.message });
    }
};

// Função para buscar tags com base na categoria ou subcategoria
export const getTags = async (req, res) => {
    const { categoryId, categoryName, subcategoryId, subcategoryName } = req.query;

    let sanityTags = [];
    let geminiSuggestedTags = [];
    let geminiErrorFlag = false;

    // Determina a chave de cache e o contexto para o prompt da Gemini
    let cacheKey = 'general_tags'; // Fallback para tags gerais
    let promptContext = 'cursos';

    if (subcategoryId && subcategoryName) {
        cacheKey = `subcat-${subcategoryId}`;
        promptContext = `a subcategoria "${subcategoryName}"`;
    } else if (categoryId && categoryName) {
        cacheKey = `cat-${categoryId}`;
        promptContext = `a categoria "${categoryName}"`;
    }

    // 1. Buscar Tags do Sanity
    try {
        // Query para buscar todas as tags existentes
        const query = `*[_type == "courseTag"]{_id, title}`;
        const rawSanityTags = await sanityClient.fetch(query);
        
        sanityTags = rawSanityTags.filter(tag => 
            tag && typeof tag._id === 'string' && typeof tag.title === 'string' && tag.title.trim() !== ''
        ).map(tag => ({
            _id: tag._id,
            name: tag.title // Mapeia 'title' para 'name'
        }));
        
        console.log(`[Backend] Buscadas ${sanityTags.length} tags válidas do Sanity.`);
    } catch (error) {
        console.error('Erro ao buscar tags do Sanity:', error.message);
    }

    // 2. Buscar Tags da Gemini (com cache)
    if (!GEMINI_API_KEY) {
        console.warn("[Backend] GEMINI_API_KEY não configurada. Não será possível gerar tags com Gemini.");
        geminiErrorFlag = true;
    } else {
        const now = Date.now();
        
        if (cachedGeminiTags[cacheKey] && (now - geminiTagCacheTimestamps[cacheKey] < GEMINI_TAG_CACHE_LIFETIME_MS)) {
            console.log(`[Backend] Servindo tags da Gemini do cache para ${promptContext}.`);
            geminiSuggestedTags = cachedGeminiTags[cacheKey];
        } else {
            console.log(`[Backend] Cache de tags Gemini expirado ou não definido para ${promptContext}. Chamando Gemini API...`);
            try {
                const geminiPrompt = `Liste 10 a 15 tags relevantes e populares para ${promptContext}. Responda APENAS com uma lista JSON de strings, sem descrições ou textos adicionais, sem markdown. Exemplo para "Desenvolvimento Web": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Frontend", "Backend", "Fullstack"]`;

                const geminiResponse = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
                    { contents: [{ parts: [{ text: geminiPrompt }] }] },
                    { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
                );

                const suggestedNames = parseGeminiResponse(geminiResponse);
                geminiSuggestedTags = suggestedNames
                    .filter(name => typeof name === 'string' && name.trim() !== '')
                    .map(name => ({
                        _id: `gemini-tag-${name.toLowerCase().replace(/\s/g, '-')}-${cacheKey}`, // ID único para tags Gemini
                        name: name
                    }));

                cachedGeminiTags[cacheKey] = geminiSuggestedTags;
                geminiTagCacheTimestamps[cacheKey] = now;
                console.log(`[Backend] Geradas e cacheadas ${geminiSuggestedTags.length} tags da Gemini para ${promptContext}.`);

            } catch (geminiError) {
                console.error(`Erro ao chamar Gemini API para tags de ${promptContext}:`, geminiError.response?.data || geminiError.message);
                geminiErrorFlag = true;

                if (cachedGeminiTags[cacheKey]) {
                    console.warn("[Backend] Gemini API call failed, serving stale tag cache if available.");
                    geminiSuggestedTags = cachedGeminiTags[cacheKey];
                } else {
                    console.warn("[Backend] Gemini API call failed and no tag cache available. Gemini tags will be empty.");
                    geminiSuggestedTags = [];
                }
            }
        }
    }

    // 3. Combinar, Remover Duplicatas e Ordenar
    const combinedTagsMap = new Map();

    // Adiciona tags do Sanity (prioridade)
    sanityTags.forEach(tag => {
        if (tag && typeof tag.name === 'string' && tag.name.trim() !== '') {
            const normalizedName = tag.name.toLowerCase();
            combinedTagsMap.set(normalizedName, tag);
        }
    });

    // Adiciona tags sugeridas pela Gemini se não existirem já pelo nome
    geminiSuggestedTags.forEach(tag => {
        if (tag && typeof tag.name === 'string' && tag.name.trim() !== '') { 
            const normalizedName = tag.name.toLowerCase();
            if (!combinedTagsMap.has(normalizedName)) {
                combinedTagsMap.set(normalizedName, tag);
            }
        }
    });

    const finalTags = Array.from(combinedTagsMap.values());
    finalTags.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[Backend] Total de ${finalTags.length} tags combinadas para ${promptContext} (Sanity + Gemini).`);
    
    res.status(200).json({ 
        tags: finalTags,
        geminiQuotaExceeded: geminiErrorFlag 
    });
};

// Função para criar uma nova tag no Sanity
export const createTag = async (req, res) => {
    // NOVO: Agora espera 'title' E 'categoryIds' (array de IDs de categoria)
    const { title, categoryIds } = req.body; 

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'O título da tag é obrigatório e deve ser uma string não vazia.' });
    }
    // Validação para categoryIds
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ message: 'Pelo menos um ID de categoria deve ser fornecido para associar a tag.' });
    }
    // Opcional: Validar se cada categoryId é uma string válida
    if (categoryIds.some(id => typeof id !== 'string' || id.trim() === '')) {
        return res.status(400).json({ message: 'Todos os IDs de categoria fornecidos devem ser strings não vazias.' });
    }

    try {
        // Verifica se a tag já existe pelo título
        const existingTag = await sanityClient.fetch(`*[_type == "courseTag" && title == $title][0]`, { title });
        if (existingTag) {
            return res.status(409).json({ message: 'Esta tag já existe.' });
        }
    } catch (error) {
        console.error('Erro ao verificar tag existente no Sanity:', error.message);
    }

    const slugValue = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // NOVO: Mapeia os categoryIds para o formato de referência do Sanity
    const categoryReferences = categoryIds.map(id => ({
        _type: 'reference',
        _ref: id
    }));

    const newTagDoc = {
        _type: 'courseTag',
        title: title.trim(),
        slug: {
            _type: 'slug',
            current: slugValue
        },
        categories: categoryReferences // NOVO: Adiciona as referências de categoria
    };

    try {
        const createdDoc = await sanityClient.create(newTagDoc);
        console.log(`[Backend] Tag "${createdDoc.title}" criada no Sanity com ID: ${createdDoc._id}, Slug: ${createdDoc.slug.current}, Categorias Associadas: ${categoryIds.join(', ')}`);
        
        // Invalida todos os caches de tags, pois uma nova tag pode ser relevante para qualquer contexto
        cachedGeminiTags = {}; 
        geminiTagCacheTimestamps = {};

        // Retorna a tag criada no formato que o frontend espera (_id, name)
        res.status(201).json({ _id: createdDoc._id, name: createdDoc.title });

    } catch (error) {
        console.error('Erro ao criar tag no Sanity:', error.message);
        res.status(500).json({ message: 'Erro ao criar tag no Sanity.', error: error.message });
    }
};
