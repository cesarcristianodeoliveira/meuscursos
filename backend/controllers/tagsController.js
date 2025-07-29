// D:\meuscursos\backend\controllers\tagsController.js
import axios from 'axios';
import sanityClient from '../utils/sanityClient.js'; // Importa o cliente Sanity
import { GEMINI_API_KEY, GEMINI_MODEL, parseGeminiResponse } from '../utils/geminiUtils.js'; // Importa utilidades Gemini
import { generateSlug } from '../utils/slugGenerator.js'; // Importa o gerador de slug

// --- Variáveis para Cache da Gemini Tags (Cache Manual) ---
let cachedGeminiTags = {}; // Objeto para armazenar cache por subcategoryId ou categoryId
const GEMINI_TAG_CACHE_LIFETIME_MS = 6 * 60 * 60 * 1000; // 6 horas
let geminiTagCacheTimestamps = {}; // Objeto para armazenar timestamps por cacheKey

// Função auxiliar para gerar sugestões de tags com Gemini
const generateGeminiTagSuggestions = async (categoryName, subcategoryName) => {
    let prompt = `Gere 10 tags de cursos únicas, relevantes e populares (palavras-chave curtas) para a área de "${categoryName}".`;
    if (subcategoryName) {
        prompt = `Gere 10 tags de cursos únicas, relevantes e populares (palavras-chave curtas) para a subcategoria "${subcategoryName}" dentro da categoria "${categoryName}".`;
    }
    prompt += ` As tags devem ser em português e separadas por vírgula. Responda APENAS com uma lista JSON de strings, sem descrições ou textos adicionais, sem markdown. Exemplo para "Desenvolvimento Web": ["HTML", "CSS", "JavaScript", "React", "Node.js", "C#", "Python", "Frontend", "Backend", "Fullstack", "Banco de Dados", "APIs", "Cloud", "DevOps", "Mobile"]`;

    try {
        const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
        );

        const suggestedNames = parseGeminiResponse(geminiResponse);
        // Filtra para garantir que são strings válidas e não vazias
        const tags = suggestedNames.filter(name => typeof name === 'string' && name.trim() !== '');
        return tags;
    } catch (error) {
        console.error("Erro ao gerar sugestões de tags com Gemini:", error.response?.data || error.message);
        // Se a cota for excedida ou outro erro de API, retorne um indicador
        if (error.response && error.response.status === 429) { 
            throw new Error('GEMINI_QUOTA_EXCEEDED');
        }
        return [];
    }
};

// @route   GET /api/tags
// @desc    Obter tags existentes do Sanity.io e sugerir novas com Gemini
// @access  Private (requer autenticação)
export const getTags = async (req, res) => {
    const { categoryId, subcategoryId, categoryName, subcategoryName } = req.query;

    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado. Token não fornecido ou inválido.' });
    }

    let sanityTags = [];
    let geminiSuggestedTags = [];
    let geminiErrorFlag = false;

    // Determina a chave de cache e o contexto para o prompt da Gemini
    let cacheKey = 'general_tags'; // Fallback para tags gerais
    let promptContext = 'cursos';

    // Construir a query do Sanity para filtrar tags
    let sanityQuery = `*[_type == "courseTag"`;
    let sanityQueryParams = {};

    // Corrigido: Usar 'references' para filtrar por referências de categoria/subcategoria
    if (subcategoryId) {
        cacheKey = `subcat-${subcategoryId}`;
        promptContext = `a subcategoria "${subcategoryName}" dentro da categoria "${categoryName}"`;
        sanityQuery += ` && references($subcategoryId)`;
        sanityQueryParams.subcategoryId = subcategoryId;
    } else if (categoryId) {
        cacheKey = `cat-${categoryId}`;
        promptContext = `a categoria "${categoryName}"`;
        sanityQuery += ` && references($categoryId)`;
        sanityQueryParams.categoryId = categoryId;
    }
    sanityQuery += `]{_id, title}`; // Seleciona os campos necessários
    sanityQuery += ` | order(title asc)`; // Ordena por título

    // 1. Buscar Tags do Sanity (AGORA FILTRADAS E ORDENADAS)
    try {
        const rawSanityTags = await sanityClient.fetch(sanityQuery, sanityQueryParams);
        
        sanityTags = rawSanityTags.filter(tag => 
            tag && typeof tag._id === 'string' && typeof tag.title === 'string' && tag.title.trim() !== ''
        ).map(tag => ({
            _id: tag._id,
            name: tag.title // Mapeia 'title' para 'name' para consistência no frontend
        }));
        
        console.log(`[Backend] Buscadas ${sanityTags.length} tags válidas do Sanity para ${promptContext}.`);
    } catch (error) {
        console.error('Erro ao buscar tags do Sanity:', error.message);
    }

    // 2. Buscar Tags da Gemini (com cache manual)
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
                const rawGeminiSuggestions = await generateGeminiTagSuggestions(categoryName, subcategoryName);
                
                // Deduplicar sugestões da Gemini contra tags existentes do Sanity
                const existingTagNames = new Set(sanityTags.map(tag => tag.name.toLowerCase()));
                geminiSuggestedTags = rawGeminiSuggestions.filter(geminiTagName => 
                    !existingTagNames.has(geminiTagName.toLowerCase())
                ).map(name => ({ 
                    // Gera um ID Gemini único que inclui o slug do contexto e da tag
                    _id: `gemini-tag-${generateSlug(promptContext.replace(/^(a|o|para)\s/, '').replace(/"/g, ''), name)}`, 
                    name: name 
                }));

                cachedGeminiTags[cacheKey] = geminiSuggestedTags;
                geminiTagCacheTimestamps[cacheKey] = now;
                console.log(`[Backend] Geradas e cacheadas ${geminiSuggestedTags.length} tags da Gemini para ${promptContext}.`);

            } catch (geminiError) {
                if (geminiError.message === 'GEMINI_QUOTA_EXCEEDED') {
                    geminiQuotaExceeded = true; // Define a flag para o frontend
                    console.warn("Cota da Gemini API excedida para sugestão de tags.");
                } else {
                    console.error("Erro inesperado ao gerar sugestões Gemini para tags:", geminiError);
                }
                // Se houver erro na Gemini e não houver cache, as sugestões ficam vazias
                geminiSuggestedTags = cachedGeminiTags[cacheKey] || []; 
            }
        }
    }

    // 3. Combinar tags do Sanity e sugestões da Gemini (priorizando Sanity)
    const combinedTagsMap = new Map(); // Usa Map para garantir unicidade e ordem de inserção

    // Adiciona tags do Sanity (prioridade)
    sanityTags.forEach(tag => {
        if (tag && typeof tag.name === 'string' && tag.name.trim() !== '') {
            const normalizedName = tag.name.toLowerCase();
            combinedTagsMap.set(normalizedName, tag);
        }
    });

    // Adiciona tags sugeridas pela Gemini se não existirem já pelo nome (case-insensitive)
    geminiSuggestedTags.forEach(tag => {
        if (tag && typeof tag.name === 'string' && tag.name.trim() !== '') { 
            const normalizedName = tag.name.toLowerCase();
            if (!combinedTagsMap.has(normalizedName)) {
                combinedTagsMap.set(normalizedName, tag);
            }
        }
    });

    const finalTags = Array.from(combinedTagsMap.values());
    // 4. Ordenar a lista combinada alfabeticamente pelo nome
    finalTags.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[Backend] Total de ${finalTags.length} tags combinadas para ${promptContext} (Sanity + Gemini).`);
    
    res.status(200).json({ 
        tags: finalTags,
        geminiQuotaExceeded: geminiErrorFlag 
    });
};

// @route   POST /api/tags
// @desc    Criar uma nova tag no Sanity.io
// @access  Private (requer autenticação)
export const createTag = async (req, res) => {
    const { title, categoryIds = [], categoryNames = [], parentCategoryForSubcategoryGemini } = req.body; 

    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado. Token não fornecido ou inválido.' });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'O título da tag é obrigatório e deve ser uma string não vazia.' });
    }
    if (categoryIds && !Array.isArray(categoryIds)) {
        return res.status(400).json({ message: 'categoryIds deve ser um array de strings.' });
    }
    if (categoryNames && !Array.isArray(categoryNames)) {
        return res.status(400).json({ message: 'categoryNames deve ser um array de strings.' });
    }
    if (categoryIds && categoryNames && categoryIds.length !== categoryNames.length) {
        return res.status(400).json({ message: 'Os arrays categoryIds e categoryNames devem ter o mesmo tamanho.' });
    }

    // Verificar se a tag já existe para evitar duplicatas
    try {
        const existingTag = await sanityClient.fetch(`*[_type == "courseTag" && lower(title) == lower($title)][0]`, { title });
        if (existingTag) {
            // Se a tag já existe, retorne-a em vez de um erro 409,
            // pois o frontend precisa do ID real para selecioná-la.
            return res.status(200).json({ 
                _id: existingTag._id, 
                name: existingTag.title,
                message: 'Esta tag já existe e foi retornada.' 
            });
        }
    } catch (error) {
        console.error('Erro ao verificar tag existente no Sanity:', error.message);
        // Não retornar erro 500 aqui, apenas logar. A criação pode continuar.
    }

    let baseSlugParts = []; // Partes para formar o slug hierárquico da tag

    // Tenta encontrar a categoria/subcategoria mais específica para o slug
    let primaryCategorySlug = null;
    let primarySubcategorySlug = null;

    if (categoryIds && categoryIds.length > 0) {
        // Prioriza a subcategoria para o slug, se houver
        const subcategoryRef = categoryIds.find(id => id.includes('sub-') || id.startsWith('gemini-sub-'));
        if (subcategoryRef) {
            try {
                // Se for uma subcategoria Gemini, o ID pode ser temporário, então busca pelo nome/slug
                const subcategoryDoc = await sanityClient.fetch(
                    `*[_id == $id || (_type == "courseSubCategory" && slug.current == $slug)][0]{title, slug, parentCategory->{slug}}`, 
                    { id: subcategoryRef, slug: generateSlug(categoryNames[categoryIds.indexOf(subcategoryRef)]) }
                );
                if (subcategoryDoc && subcategoryDoc.slug && subcategoryDoc.parentCategory && subcategoryDoc.parentCategory.slug) {
                    primaryCategorySlug = subcategoryDoc.parentCategory.slug.current;
                    primarySubcategorySlug = subcategoryDoc.slug.current;
                    baseSlugParts.push(primaryCategorySlug, primarySubcategorySlug);
                }
            } catch (error) {
                console.warn(`Erro ao buscar slug da subcategoria para tag: ${error.message}`);
            }
        }

        // Se não encontrou subcategoria ou seu slug, tenta a categoria principal
        if (!primaryCategorySlug) {
            const categoryRef = categoryIds.find(id => !id.includes('sub-') || id.startsWith('gemini-'));
            if (categoryRef) {
                try {
                    // Se for uma categoria Gemini, o ID pode ser temporário, então busca pelo nome/slug
                    const categoryDoc = await sanityClient.fetch(
                        `*[_id == $id || (_type == "courseCategory" && slug.current == $slug)][0]{title, slug}`, 
                        { id: categoryRef, slug: generateSlug(categoryNames[categoryIds.indexOf(categoryRef)]) }
                    );
                    if (categoryDoc && categoryDoc.slug) {
                        primaryCategorySlug = categoryDoc.slug.current;
                        baseSlugParts.push(primaryCategorySlug);
                    }
                } catch (error) {
                    console.warn(`Erro ao buscar slug da categoria para tag: ${error.message}`);
                }
            }
        }
    }

    // Adiciona o título da tag como a última parte do slug
    baseSlugParts.push(title);
    const slugValue = generateSlug(...baseSlugParts); 

    const finalCategoryReferences = [];
    if (categoryIds && categoryIds.length > 0) {
        for (let i = 0; i < categoryIds.length; i++) {
            let currentCategoryId = categoryIds[i];
            let currentCategoryName = categoryNames[i] || ''; 

            if (!currentCategoryId || typeof currentCategoryId !== 'string' || currentCategoryId.trim() === '') {
                console.warn(`[Backend] ID de categoria inválido encontrado para tag: ${currentCategoryId}`);
                continue; 
            }

            if (currentCategoryId.startsWith('gemini-')) {
                try {
                    let docType = 'courseCategory'; 
                    let querySlug = generateSlug(currentCategoryName); // Slug para buscar/criar
                    let parentRefForSubcat = null;

                    if (currentCategoryId.includes('sub-')) {
                        docType = 'courseSubCategory';
                        // Se for uma subcategoria Gemini, precisamos do ID real da categoria pai
                        // para criar a referência corretamente no Sanity.
                        if (parentCategoryForSubcategoryGemini && parentCategoryForSubcategoryGemini._id) {
                            parentRefForSubcat = {
                                _type: 'reference',
                                _ref: parentCategoryForSubcategoryGemini._id
                            };
                            // O slug da subcategoria Gemini também deve incluir o slug da categoria pai
                            const parentCatSlugForSubcat = await sanityClient.fetch(
                                `*[_id == $id][0].slug.current`, 
                                { id: parentCategoryForSubcategoryGemini._id }
                            );
                            querySlug = generateSlug(parentCatSlugForSubcat, currentCategoryName);
                        }
                    }

                    const existingSanityDoc = await sanityClient.fetch(
                        `*[_type == $docType && slug.current == $querySlug][0]`, // Busca pelo slug agora
                        { docType, querySlug }
                    );

                    if (existingSanityDoc) {
                        finalCategoryReferences.push({ _type: 'reference', _ref: existingSanityDoc._id }); 
                        console.log(`[Backend] ${docType} Gemini "${currentCategoryName}" (para tag) já existe no Sanity com ID: ${existingSanityDoc._id}. Usando existente.`);
                    } else {
                        const newDoc = {
                            _type: docType,
                            title: currentCategoryName.trim(),
                            slug: {
                                _type: 'slug',
                                current: querySlug // Usa o slug hierárquico
                            }
                        };
                        if (parentRefForSubcat) {
                            newDoc.parentCategory = parentRefForSubcat;
                        }

                        const createdDoc = await sanityClient.create(newDoc);
                        finalCategoryReferences.push({ _type: 'reference', _ref: createdDoc._id }); 
                        console.log(`[Backend] ${docType} Gemini "${currentCategoryName}" criada no Sanity com ID: ${createdDoc._id}.`);
                        
                        // Invalida o cache relevante para categorias/subcategorias
                        // (assumindo que categoryController e subcategoryController têm suas próprias lógicas de cache)
                        // Não é necessário invalidar aqui se o cache for gerenciado por eles.
                    }
                } catch (error) {
                    console.error(`Erro ao verificar/criar ${docType} Gemini para tag:`, error.message);
                }
            } else {
                finalCategoryReferences.push({ _type: 'reference', _ref: currentCategoryId }); 
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
        categories: finalCategoryReferences.length > 0 ? finalCategoryReferences : undefined // Adiciona apenas se houver referências
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
            associatedCategories: createdDoc.categories // Retorna as categorias associadas
        });

    } catch (error) {
        console.error('Erro ao criar tag no Sanity:', error.message);
        res.status(500).json({ message: 'Erro ao criar tag no Sanity.', error: error.message });
    }
};
