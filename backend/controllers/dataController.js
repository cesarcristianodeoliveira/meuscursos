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

// NOVO: Função para gerar slugs de forma mais robusta (lidando com acentos)
const generateSlug = (title) => {
    return title
        .normalize("NFD") // Normaliza para decompor caracteres acentuados
        .replace(/[\u0300-\u036f]/g, "") // Remove os diacríticos (acentos)
        .toLowerCase() // Converte para minúsculas
        .trim() // Remove espaços em branco do início/fim
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/[^\w-]+/g, ''); // Remove todos os caracteres não-palavra e não-hífens
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
                        _id: `gemini-${generateSlug(name)}`, // Usa o novo gerador de slug para o ID Gemini
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

    // Geração do slug a partir do título usando a nova função
    const slugValue = generateSlug(title);

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
                        _id: `gemini-sub-${generateSlug(name)}-${categoryId}`, // Usa o novo gerador de slug
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
    // NOVO: parentCategoryName é obrigatório para o fluxo de criação automática
    if (!parentCategoryName || typeof parentCategoryName !== 'string' || parentCategoryName.trim() === '') {
        return res.status(400).json({ message: 'O nome da categoria pai é obrigatório para criar uma subcategoria.' });
    }


    let finalParentCategoryId = parentCategoryId;
    let finalParentCategoryName = parentCategoryName; // Já temos o nome, usamos ele.

    // VERIFICAÇÃO E CRIAÇÃO DA CATEGORIA PAI SE NECESSÁRIO
    // Esta lógica só deve ser executada se o parentCategoryId for um ID gerado pela Gemini
    // e *não* um ID real do Sanity que já foi persistido.
    if (parentCategoryId.startsWith('gemini-')) {
        try {
            // Tenta buscar a categoria pelo título (nome) no Sanity
            const existingSanityCategory = await sanityClient.fetch(
                `*[_type == "courseCategory" && title == $title][0]`, 
                { title: parentCategoryName }
            );

            if (existingSanityCategory) {
                finalParentCategoryId = existingSanityCategory._id;
                finalParentCategoryName = existingSanityCategory.title;
                console.log(`[Backend] Categoria Gemini "${parentCategoryName}" já existe no Sanity com ID: ${finalParentCategoryId}. Usando existente.`);
            } else {
                // Se não existe, cria a categoria no Sanity
                const categorySlug = generateSlug(parentCategoryName); // Usa o novo gerador de slug
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
                console.log(`[Backend] Categoria Gemini "${parentCategoryName}" criada no Sanity com ID: ${finalParentCategoryId}.`);
                
                // Invalida o cache de categorias para que a nova seja incluída
                cachedGeminiCategories = null;
                geminiCategoryCacheTimestamp = 0;
            }
        } catch (error) {
            console.error('Erro ao verificar/criar categoria pai no Sanity:', error.message);
            return res.status(500).json({ message: 'Erro interno ao processar a categoria pai.', error: error.message });
        }
    } else {
        // Se não é um ID Gemini, assume que é um ID Sanity real.
        // Já temos o parentCategoryName do frontend, então não precisamos buscar novamente,
        // a menos que queiramos validar que o ID realmente corresponde ao nome.
        // Por simplicidade, vamos confiar no nome vindo do frontend se o ID for Sanity.
        // Se a validação for crítica, uma busca aqui seria necessária.
        try {
            const parentCat = await sanityClient.fetch(`*[_id == $parentCategoryId][0]{title}`, { parentCategoryId });
            if (parentCat) {
                // Se o nome vindo do frontend e o nome do Sanity forem diferentes,
                // podemos logar um aviso ou usar o nome do Sanity.
                if (parentCat.title !== finalParentCategoryName) {
                    console.warn(`[Backend] Nome da categoria pai (${finalParentCategoryName}) difere do Sanity (${parentCat.title}) para ID ${parentCategoryId}. Usando nome do Sanity.`);
                    finalParentCategoryName = parentCat.title;
                }
            } else {
                console.warn(`[Backend] Categoria pai com ID "${parentCategoryId}" não encontrada no Sanity.`);
                return res.status(400).json({ message: `Categoria pai com ID "${parentCategoryId}" não encontrada.` });
            }
        } catch (error) {
            console.error('Erro ao buscar nome da categoria pai no Sanity:', error.message);
            return res.status(500).json({ message: 'Erro interno ao verificar a categoria pai.', error: error.message });
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
        // Continua mesmo com erro na verificação para não bloquear a criação
    }

    const slugValue = generateSlug(title); // Usa o novo gerador de slug

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
                        _id: `gemini-tag-${generateSlug(name)}-${cacheKey}`, // Usa o novo gerador de slug
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
    const { title, categoryIds, categoryNames } = req.body; 

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'O título da tag é obrigatório e deve ser uma string não vazia.' });
    }
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ message: 'Pelo menos um ID de categoria deve ser fornecido para associar a tag.' });
    }
    if (categoryIds.some(id => typeof id !== 'string' || id.trim() === '')) {
        return res.status(400).json({ message: 'Todos os IDs de categoria fornecidos devem ser strings não vazias.' });
    }
    if (!Array.isArray(categoryNames) || categoryNames.length !== categoryIds.length) {
        return res.status(400).json({ message: 'Os nomes das categorias devem ser fornecidos e corresponder aos IDs.' });
    }

    const finalCategoryReferences = [];
    const finalCategoryNames = [];

    // Processa cada categoryId para garantir que a categoria existe no Sanity
    for (let i = 0; i < categoryIds.length; i++) {
        let currentCategoryId = categoryIds[i];
        let currentCategoryName = categoryNames[i];

        if (currentCategoryId.startsWith('gemini-')) {
            try {
                // Tenta buscar a categoria pelo título (nome) no Sanity
                const existingSanityCategory = await sanityClient.fetch(
                    `*[_type == "courseCategory" && title == $title][0]`, 
                    { title: currentCategoryName }
                );

                if (existingSanityCategory) {
                    finalCategoryReferences.push({ _type: 'reference', _ref: existingSanityCategory._id });
                    finalCategoryNames.push(existingSanityCategory.title);
                    console.log(`[Backend] Categoria Gemini "${currentCategoryName}" (para tag) já existe no Sanity com ID: ${existingSanityCategory._id}. Usando existente.`);
                } else {
                    // Se não existe, cria a categoria no Sanity
                    const categorySlug = generateSlug(currentCategoryName); // Usa o novo gerador de slug
                    const newCategoryDoc = {
                        _type: 'courseCategory',
                        title: currentCategoryName.trim(),
                        slug: {
                            _type: 'slug',
                            current: categorySlug
                        }
                    };
                    const createdCategory = await sanityClient.create(newCategoryDoc);
                    finalCategoryReferences.push({ _type: 'reference', _ref: createdCategory._id });
                    finalCategoryNames.push(createdCategory.title);
                    console.log(`[Backend] Categoria Gemini "${currentCategoryName}" (para tag) criada no Sanity com ID: ${createdCategory._id}.`);
                    
                    // Invalida o cache de categorias para que a nova seja incluída
                    cachedGeminiCategories = null;
                    geminiCategoryCacheTimestamp = 0;
                }
            } catch (error) {
                console.error(`Erro ao verificar/criar categoria pai para tag no Sanity (${currentCategoryName}):`, error.message);
                return res.status(500).json({ message: `Erro interno ao processar a categoria "${currentCategoryName}" para a tag.`, error: error.message });
            }
        } else {
            // Se não é um ID Gemini, assume que é um ID Sanity real e apenas adiciona a referência
            try {
                const existingCat = await sanityClient.fetch(`*[_id == $id][0]{title}`, { id: currentCategoryId });
                if (existingCat) {
                    finalCategoryReferences.push({ _type: 'reference', _ref: currentCategoryId });
                    finalCategoryNames.push(existingCat.title);
                } else {
                    console.warn(`[Backend] Categoria com ID "${currentCategoryId}" não encontrada no Sanity ao criar tag.`);
                    return res.status(400).json({ message: `Categoria com ID "${currentCategoryId}" não encontrada.` });
                }
            } catch (error) {
                console.error(`Erro ao buscar categoria por ID para tag (${currentCategoryId}):`, error.message);
                return res.status(500).json({ message: `Erro interno ao verificar a categoria "${currentCategoryId}" para a tag.`, error: error.message });
            }
        }
    }

    try {
        const existingTag = await sanityClient.fetch(`*[_type == "courseTag" && title == $title][0]`, { title });
        if (existingTag) {
            return res.status(409).json({ message: 'Esta tag já existe.' });
        }
    } catch (error) {
        console.error('Erro ao verificar tag existente no Sanity:', error.message);
    }

    const slugValue = generateSlug(title); // Usa o novo gerador de slug

    const newTagDoc = {
        _type: 'courseTag',
        title: title.trim(),
        slug: {
            _type: 'slug',
            current: slugValue
        },
        categories: finalCategoryReferences // Usa as referências finais
    };

    try {
        const createdDoc = await sanityClient.create(newTagDoc);
        console.log(`[Backend] Tag "${createdDoc.title}" criada no Sanity com ID: ${createdDoc._id}, Slug: ${createdDoc.slug.current}, Categorias Associadas (Finais): ${finalCategoryNames.join(', ')}`);
        
        cachedGeminiTags = {}; 
        geminiTagCacheTimestamps = {};

        res.status(201).json({ 
            _id: createdDoc._id, 
            name: createdDoc.title,
            categoryIds: finalCategoryReferences.map(ref => ref._ref), // Retorna os IDs finais
            categoryNames: finalCategoryNames // Retorna os nomes finais
        });

    } catch (error) {
        console.error('Erro ao criar tag no Sanity:', error.message);
        res.status(500).json({ message: 'Erro ao criar tag no Sanity.', error: error.message });
    }
};

// Função para buscar imagens do Pixabay
export const getPixabayImages = async (req, res) => {
    const { searchQuery } = req.query; // Termo de busca
    const perPage = 12; // Número de imagens a retornar

    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim() === '') {
        return res.status(400).json({ message: 'O termo de busca é obrigatório para buscar imagens.' });
    }
    if (!PIXABAY_API_KEY) {
        console.warn("[Backend] PIXABAY_API_KEY não configurada. Não será possível buscar imagens do Pixabay.");
        return res.status(503).json({ message: 'Serviço de imagens indisponível (API Key não configurada).' });
    }

    const cacheKey = searchQuery.toLowerCase().replace(/\s+/g, '_');
    const now = Date.now();

    // Tenta servir do cache primeiro
    if (cachedPixabayImages[cacheKey] && (now - pixabayImageCacheTimestamps[cacheKey] < PIXABAY_IMAGE_CACHE_LIFETIME_MS)) {
        console.log(`[Backend] Servindo imagens do Pixabay do cache para "${searchQuery}".`);
        return res.status(200).json({ images: cachedPixabayImages[cacheKey] });
    }

    console.log(`[Backend] Cache de imagens Pixabay expirado ou não definido para "${searchQuery}". Chamando Pixabay API...`);

    try {
        const response = await axios.get(PIXABAY_BASE_URL, {
            params: {
                key: PIXABAY_API_KEY,
                q: searchQuery,
                image_type: 'photo',
                orientation: 'horizontal', // Ou 'vertical', 'all'
                per_page: perPage,
                min_width: 600, // Imagens de boa qualidade
                min_height: 400,
                safesearch: true,
                lang: 'pt' // Preferência por conteúdo em português
            },
            timeout: 15000 // Timeout de 15 segundos
        });

        const images = response.data.hits.map(hit => ({
            id: hit.id,
            webformatURL: hit.webformatURL, // URL da imagem para exibição
            largeImageURL: hit.largeImageURL, // URL da imagem em alta resolução (para uso futuro)
            tags: hit.tags,
            user: hit.user,
            pageURL: hit.pageURL // Link para a página da imagem no Pixabay
        }));

        // Armazena no cache
        cachedPixabayImages[cacheKey] = images;
        pixabayImageCacheTimestamps[cacheKey] = now;
        console.log(`[Backend] Buscadas e cacheadas ${images.length} imagens do Pixabay para "${searchQuery}".`);

        res.status(200).json({ images });

    } catch (error) {
        console.error(`Erro ao buscar imagens do Pixabay para "${searchQuery}":`, error.response?.data || error.message);
        // Se houver erro, tenta servir do cache antigo se disponível
        if (cachedPixabayImages[cacheKey]) {
            console.warn("[Backend] Pixabay API call failed, serving stale image cache if available.");
            return res.status(200).json({ images: cachedPixabayImages[cacheKey], error: 'Erro ao buscar novas imagens, servindo do cache.' });
        }
        res.status(500).json({ message: 'Erro ao buscar imagens do Pixabay.', error: error.message });
    }
};
