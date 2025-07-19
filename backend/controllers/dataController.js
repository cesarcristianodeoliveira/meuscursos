// D:\meuscursos\backend\controllers\dataController.js

import axios from 'axios';
import { createClient } from '@sanity/client'; // Importa o cliente Sanity

// --- Configurações da Gemini API ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

// --- Variáveis para Cache da Gemini Categories ---
let cachedGeminiCategories = null;
const GEMINI_CATEGORY_CACHE_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
let geminiCategoryCacheTimestamp = 0;

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
                combinedCategoriesMap.set(normalizedName, { _id: cat._id, name: cat.name });
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

// NOVO: Função para criar uma nova categoria no Sanity
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

    const newCategoryDoc = {
        _type: 'courseCategory',
        title: title.trim(),
        // Sanity irá gerar o _id automaticamente. O slug pode ser gerado no Sanity Studio
        // ou você pode gerar aqui se quiser controle total:
        // slug: {
        //     _type: 'slug',
        //     current: title.toLowerCase().replace(/\s+/g, '-').slice(0, 96)
        // }
    };

    try {
        const createdDoc = await sanityClient.create(newCategoryDoc);
        console.log(`[Backend] Categoria "${createdDoc.title}" criada no Sanity com ID: ${createdDoc._id}`);
        
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
