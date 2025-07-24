// D:\meuscursos\backend\utils\geminiUtils.js

// --- Configurações da Gemini API ---
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const GEMINI_MODEL = 'gemini-1.5-flash';

// Helper para parsear a resposta JSON do Gemini
export const parseGeminiResponse = (response) => {
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
