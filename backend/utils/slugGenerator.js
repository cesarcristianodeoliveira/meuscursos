// D:\meuscursos\backend\utils\slugGenerator.js

// Função para gerar slugs de forma mais robusta (lidando com acentos)
// Agora aceita um array de partes para criar slugs hierárquicos
export const generateSlug = (...parts) => {
    // Filtra partes nulas/vazias e une-as com um hífen
    const fullString = parts.filter(Boolean).join('-'); 
    
    return fullString
        .normalize("NFD") // Normaliza para decompor caracteres acentuados
        .replace(/[\u0300-\u036f]/g, "") // Remove os diacríticos (acentos)
        .toLowerCase() // Converte para minúsculas
        .trim() // Remove espaços em branco do início/fim
        .replace(/\s+/g, '-') // Substitui múltiplos espaços por um único hífen
        .replace(/[^\w-]+/g, '') // Remove todos os caracteres não-palavra e não-hífens
        .replace(/--+/g, '-'); // Substitui múltiplos hífens por um único hífen (para limpeza final)
};
