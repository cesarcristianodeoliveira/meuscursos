// D:\meuscursos\backend\controllers\dataController.js

import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash'; // Mantendo o modelo correto: gemini-1.5-flash

// --- Variáveis para Cache da Gemini Categories ---
let cachedGeminiCategories = null;
const CATEGORY_CACHE_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
let categoryCacheTimestamp = 0;

// Helper para parsear a resposta JSON do Gemini
const parseGeminiResponse = (response) => {
    try {
        const text = response.data.candidates[0].content.parts[0].text;
        // Tenta remover qualquer markdown de código JSON que o Gemini possa adicionar
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error('Erro ao parsear resposta do Gemini:', error);
        // Fallback robusto caso a primeira tentativa falhe
        try {
            const rawText = response.data.candidates[0].content.parts[0].text;
            const match = rawText.match(/\[\s*"(.*?)"(?:\s*,\s*"(.*?)")*\s*\]/s);
            if (match && match[0]) {
                return JSON.parse(match[0]);
            }
        } catch (e) {
            console.error('Erro ao tentar extrair array de strings do texto bruto:', e);
        }
        return []; // Retorna array vazio em caso de falha total
    }
};

// --- Funções para Categorias (Com Cache e Gemini) ---
export const getTopCategories = async (req, res) => {
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ message: 'GEMINI_API_KEY não configurada no .env.' });
    }

    const now = Date.now();

    // 1. Tenta servir do cache se ele for válido
    if (cachedGeminiCategories && (now - categoryCacheTimestamp < CATEGORY_CACHE_LIFETIME_MS)) {
        console.log("[Backend] Servindo categorias da Gemini do cache.");
        return res.status(200).json(cachedGeminiCategories);
    }

    // 2. Se o cache expirou ou não existe, chama a Gemini API
    console.log("[Backend] Cache de categorias expirado ou não definido. Chamando Gemini API...");
    try {
        const geminiPrompt = `Liste 10 categorias de cursos populares e em alta demanda (por exemplo: "Tecnologia", "Marketing", "Arte e Design", "Idiomas", "Negócios", "Saúde e Bem-estar", "Finanças", "Desenvolvimento Pessoal", "Fotografia", "Culinária"). Responda APENAS com uma lista JSON de strings, sem descrições ou textos adicionais, sem markdown. Exemplo: ["Programação", "Marketing Digital"]`;

        const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: geminiPrompt
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 20000 
            }
        );

        const suggestedCategoryNames = parseGeminiResponse(geminiResponse);

        // Transforma os nomes em um formato que o frontend espera (com _id)
        const categories = suggestedCategoryNames.map(name => ({
            _id: name.toLowerCase().replace(/\s/g, '-'), // Gera um ID simples e único
            name: name
        }));

        // 3. Atualiza o cache e o timestamp
        cachedGeminiCategories = categories;
        categoryCacheTimestamp = now;
        console.log(`[Backend] Geradas e cacheadas ${categories.length} categorias da Gemini.`);

        res.status(200).json(categories);

    } catch (geminiError) {
        console.error('Erro ao chamar Gemini API para categorias:', geminiError.response?.data || geminiError.message);
        
        // --- NOVO TRATAMENTO DE ERRO PARA COTA EXCEDIDA (429) ---
        if (geminiError.response && geminiError.response.status === 429) {
            // Se a Gemini API retornou 429, repassa essa informação
            return res.status(429).json({ message: 'Cota da Gemini API excedida. Por favor, verifique seu plano e tente novamente mais tarde.' });
        }

        // Se a Gemini falhar por outro motivo, tenta servir do cache antigo se ele existir, ou vazio se não
        if (cachedGeminiCategories) {
            console.warn("[Backend] Gemini API call failed, serving stale cache if available.");
            return res.status(200).json(cachedGeminiCategories); // Serve o cache antigo para não quebrar a aplicação
        } else {
            console.warn("[Backend] Gemini API call failed and no cache available.");
            return res.status(500).json({ message: 'Erro ao gerar categorias com Gemini API e sem cache disponível.', error: geminiError.message });
        }
    }
};
