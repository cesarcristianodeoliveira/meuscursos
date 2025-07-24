// D:\meuscursos\backend\controllers\tagsController.js

import axios from 'axios';
import sanityClient from '../utils/sanityClient.js'; // Importa o cliente Sanity
import { GEMINI_API_KEY, GEMINI_MODEL, parseGeminiResponse } from '../utils/geminiUtils.js'; // Importa utilidades Gemini
import { generateSlug } from '../utils/slugGenerator.js'; // Importa o gerador de slug

// --- Variáveis para Cache da Gemini Tags ---
let cachedGeminiTags = {}; // Objeto para armazenar cache por subcategoryId ou categoryId
const GEMINI_TAG_CACHE_LIFETIME_MS = 6 * 60 * 60 * 1000; // 6 horas
let geminiTagCacheTimestamps = {}; // Objeto para armazenar timestamps por cacheKey

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
                const geminiPrompt = `Liste 10 a 15 tags relevantes e populares para ${promptContext}. Responda APENAS com uma lista JSON de strings, sem descrições ou textos adicionais, sem markdown. Exemplo para "Desenvolvimento Web": ["HTML", "CSS", "JavaScript", "React", "Node.js", "C#", "Python", "Frontend", "Backend", "Fullstack", "Banco de Dados", "APIs", "Cloud", "DevOps", "Mobile"]`;

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
    // categoryIds e categoryNames são opcionais para tags, mas se fornecidos, devem ser arrays válidos
    if (categoryIds && !Array.isArray(categoryIds)) {
        return res.status(400).json({ message: 'categoryIds deve ser um array de strings.' });
    }
    if (categoryNames && !Array.isArray(categoryNames)) {
        return res.status(400).json({ message: 'categoryNames deve ser um array de strings.' });
    }
    if (categoryIds && categoryNames && categoryIds.length !== categoryNames.length) {
        return res.status(400).json({ message: 'Os arrays categoryIds e categoryNames devem ter o mesmo tamanho.' });
    }

    // Opcional: Verificar se a tag já existe
    try {
        const existingTag = await sanityClient.fetch(`*[_type == "courseTag" && title == $title][0]`, { title });
        if (existingTag) {
            return res.status(409).json({ message: 'Esta tag já existe.' });
        }
    } catch (error) {
        console.error('Erro ao verificar tag existente no Sanity:', error.message);
    }

    const slugValue = generateSlug(title); 

    const finalCategoryReferences = [];
    // Processa cada categoryId para garantir que a categoria existe no Sanity
    if (categoryIds && categoryIds.length > 0) {
        for (let i = 0; i < categoryIds.length; i++) {
            let currentCategoryId = categoryIds[i];
            let currentCategoryName = categoryNames[i] || ''; // Fallback para nome vazio

            if (!currentCategoryId || typeof currentCategoryId !== 'string' || currentCategoryId.trim() === '') {
                console.warn(`[Backend] ID de categoria inválido encontrado para tag: ${currentCategoryId}`);
                continue; // Pula IDs inválidos
            }

            // Se o ID for Gemini, tenta encontrar ou criar a categoria/subcategoria no Sanity
            if (currentCategoryId.startsWith('gemini-')) {
                try {
                    let docType = 'courseCategory'; 
                    if (currentCategoryId.includes('sub-')) {
                        docType = 'courseSubCategory';
                    }

                    const existingSanityDoc = await sanityClient.fetch(
                        `*[_type == $docType && title == $title][0]`, 
                        { docType, title: currentCategoryName }
                    );

                    if (existingSanityDoc) {
                        // Adiciona _key ao objeto de referência
                        finalCategoryReferences.push({ _type: 'reference', _ref: existingSanityDoc._id, _key: existingSanityDoc._id }); 
                        console.log(`[Backend] ${docType} Gemini "${currentCategoryName}" (para tag) já existe no Sanity com ID: ${existingSanityDoc._id}. Usando existente.`);
                    } else {
                        const docSlug = generateSlug(currentCategoryName); 
                        const newDoc = {
                            _type: docType,
                            title: currentCategoryName.trim(),
                            slug: {
                                _type: 'slug',
                                current: docSlug
                            }
                        };
                        // Se for subcategoria e tiver um parentCategory, precisamos adicioná-lo
                        // A categoria pai para a subcategoria Gemini deve ser um ID Sanity real
                        // Esta informação deve vir do frontend no req.body se for uma subcategoria Gemini que está sendo criada.
                        if (docType === 'courseSubCategory' && req.body.parentCategoryForSubcategoryGemini) {
                            const parentCatRefId = req.body.parentCategoryForSubcategoryGemini._id;
                            if (parentCatRefId && typeof parentCatRefId === 'string') {
                                newDoc.parentCategory = {
                                    _type: 'reference',
                                    _ref: parentCatRefId
                                };
                            } else {
                                console.warn(`[Backend] Subcategoria Gemini "${currentCategoryName}" não tem categoria pai válida para referência.`);
                            }
                        }

                        const createdDoc = await sanityClient.create(newDoc);
                        // Adiciona _key ao objeto de referência
                        finalCategoryReferences.push({ _type: 'reference', _ref: createdDoc._id, _key: createdDoc._id }); 
                        console.log(`[Backend] ${docType} Gemini "${currentCategoryName}" criada no Sanity com ID: ${createdDoc._id}.`);
                        
                        // Invalida o cache relevante
                        // (Isso é importante para os respectivos controladores)
                        // Note: cachedGeminiCategories e cachedGeminiSubcategories não estão neste arquivo.
                        // Isso será tratado nos respectivos controladores, mas é um ponto a considerar para a refatoração.
                    }
                } catch (error) {
                    console.error(`Erro ao verificar/criar ${docType} Gemini para tag:`, error.message);
                    // Não falha a criação da tag, apenas ignora esta referência
                }
            } else {
                // Se o ID não for Gemini, assume que é um ID Sanity real
                // Adiciona _key ao objeto de referência
                finalCategoryReferences.push({ _type: 'reference', _ref: currentCategoryId, _key: currentCategoryId }); 
            }
        }
    }

    const newTagDoc = {
        _type: 'courseTag',
        title: title.trim(),
        slug: {
            _type: 'slug',
            current: slugValue
        },
        categories: finalCategoryReferences // Associa as categorias/subcategorias
    };

    try {
        const createdDoc = await sanityClient.create(newTagDoc);
        console.log(`[Backend] Tag "${createdDoc.title}" criada no Sanity com ID: ${createdDoc._id}, Slug: ${createdDoc.slug.current}`);
        
        // Invalida o cache de tags para todas as combinações relevantes
        cachedGeminiTags = {}; 
        geminiTagCacheTimestamps = {};

        res.status(201).json({ 
            _id: createdDoc._id, 
            name: createdDoc.title,
            // Retorna as categorias associadas para o frontend se necessário
            associatedCategories: createdDoc.categories
        });

    } catch (error) {
        console.error('Erro ao criar tag no Sanity:', error.message);
        res.status(500).json({ message: 'Erro ao criar tag no Sanity.', error: error.message });
    }
};
