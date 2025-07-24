// D:\meuscursos\backend\utils\slugGenerator.js

// Função para gerar slugs de forma mais robusta (lidando com acentos)
export const generateSlug = (title) => {
    return title
        .normalize("NFD") // Normaliza para decompor caracteres acentuados
        .replace(/[\u0300-\u036f]/g, "") // Remove os diacríticos (acentos)
        .toLowerCase() // Converte para minúsculas
        .trim() // Remove espaços em branco do início/fim
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/[^\w-]+/g, ''); // Remove todos os caracteres não-palavra e não-hífens
};
