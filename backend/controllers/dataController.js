// D:\meuscursos\backend\controllers\dataController.js

import axios from 'axios';
// *** REMOVIDAS AS IMPORTAÇÕES DOS MODELOS MONGODB PARA A VERSÃO 0.1 ***
// import Category from '../models/Category.js';
// import SubCategory from '../models/SubCategory.js';
// import Tag from '../models/Tag.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash'; // <<< Modelo Gemini 1.5 Flash >>>

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

// --- Funções para Categorias (Adaptada para a v0.1: sem Mongoose, apenas Gemini) ---

// Esta função agora usa a Gemini API para gerar nomes de categorias
// e os retorna com IDs mockados, sem interagir com um banco de dados.
export const getTopCategories = async (req, res) => {
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ message: 'GEMINI_API_KEY não configurada no .env.' });
    }

    try {
        // Prompt para gerar categorias de cursos populares
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
                timeout: 20000 // Aumenta o timeout para 20 segundos
            }
        );

        const suggestedCategoryNames = parseGeminiResponse(geminiResponse);

        // Transforma os nomes em um formato que o frontend espera (com _id)
        const categories = suggestedCategoryNames.map(name => ({
            _id: name.toLowerCase().replace(/\s/g, '-'), // Gera um ID simples e único
            name: name
        }));

        res.status(200).json(categories);

    } catch (geminiError) {
        console.error('Erro ao chamar Gemini API para categorias:', geminiError.response?.data || geminiError.message);
        res.status(500).json({ message: 'Erro ao gerar categorias com Gemini API.', error: geminiError.message });
    }
};