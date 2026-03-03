const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateCourseContent = async (topic) => {
  const AI_MODEL = 'llama-3.3-70b-versatile';
  const AI_PROVIDER = 'Groq';

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Você é um Engenheiro de Currículos Educacionais Sênior. 
        Crie uma especialização técnica completa no formato JSON seguindo estas regras:

        REGRAS DE CONTEÚDO:
        1. CATEGORIA: Defina um nome de categoria realista (ex: "Desenvolvimento Web", "Finanças").
        2. MÉTRICAS: Estime o 'estimatedTime' (horas totais) e 'rating' (nota de 4.5 a 5.0 baseada na complexidade).
        3. EXERCÍCIOS: Cada módulo deve ter 2 exercícios de múltipla escolha.
        4. PROVA FINAL: O curso deve ter uma seção 'finalExam' com 5 questões de alta complexidade.
        5. IMAGEM: 'searchQuery' deve ser 2 substantivos em inglês para busca de fotos (ex: "laptop, code").

        ESTRUTURA JSON OBRIGATÓRIA:
        {
          "title": "Título",
          "categoryName": "Nome da Categoria",
          "pixabay_category": "Categoria Pixabay",
          "searchQuery": "query em inglês",
          "description": "Descrição curta",
          "estimatedTime": number,
          "rating": number,
          "modules": [
            { 
              "title": "Título da Aula", 
              "content": "Conteúdo denso em Markdown",
              "exercises": [
                { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "string" }
              ]
            }
          ],
          "finalExam": [
            { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "string" }
          ]
        }`
      },
      { 
        role: 'user', 
        content: `Gere um curso exaustivo sobre: "${topic}".` 
      }
    ],
    model: AI_MODEL,
    temperature: 0.6,
    max_tokens: 6000, // Aumentado para suportar exercícios e prova
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(completion.choices[0].message.content);
  
  // Anexa metadados da IA para o controller
  return {
    ...content,
    aiProvider: AI_PROVIDER,
    aiModel: AI_MODEL
  };
};

module.exports = { generateCourseContent };