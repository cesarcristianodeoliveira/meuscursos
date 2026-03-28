const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSystemPrompt = (isFullAccess) => {
  const exerciseRule = isFullAccess 
    ? "EXERCÍCIOS: Cada módulo deve conter EXATAMENTE 3 exercícios de fixação de múltipla escolha."
    : "EXERCÍCIOS: O array 'exercises' DEVE estar vazio [].";

  return `Você é um Designer Instrucional Sênior e Especialista em EAD. 
Crie um curso online de alta retenção no formato JSON seguindo estas diretrizes:

REGRAS DE ESTRUTURA E PEDAGOGIA:
1. QUANTIDADE: Gere entre 4 a 6 módulos densos.
2. DENSIDADE: Cada módulo deve ser exaustivo, com conteúdo técnico em Markdown.
3. ${exerciseRule}
4. PROVA FINAL: Crie a seção 'finalExam' com 10 a 20 perguntas.
5. TAGS: Crie um array 'tags' com 5 palavras-chave relevantes (ex: ["Web", "HTML", "Frontend"]).
6. RATING: Gere um número entre 4.0 e 5.0 para o campo 'rating'.
7. IMAGEM: 'searchQuery' deve conter 2 substantivos concretos em inglês para busca de fotos.

ESTRUTURA JSON OBRIGATÓRIA (Siga exatamente):
{
  "title": "string",
  "category": { "name": "string", "slug": "string" },
  "description": "string (+300 caracteres)",
  "rating": number,
  "level": "${isFullAccess ? 'intermediario ou avancado' : 'iniciante'}",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "searchQuery": "string",
  "modules": [
    { 
      "title": "string", 
      "content": "Markdown...",
      "exercises": [ 
        { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "texto da opção" } 
      ]
    }
  ],
  "finalExam": [ 
    { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "texto da opção" } 
  ]
}`;
};

const generateCourseContent = async (topic, provider = 'groq', options = {}) => {
  const { fullContent = false } = options;

  const config = {
    groq: { name: 'Groq', model: 'llama-3.3-70b-versatile' },
    openai: { name: 'OpenAI', model: 'gpt-4o' }
  };

  const selected = config[provider] || config.groq;

  try {
    if (!process.env.GROQ_API_KEY) throw new Error("API_KEY_MISSING");

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: getSystemPrompt(fullContent) },
        { role: 'user', content: `Gere um curso técnico ${fullContent ? 'COMPLETO' : 'BÁSICO'} sobre: "${topic}".` }
      ],
      model: selected.model,
      temperature: 0.6,
      max_tokens: 8000, 
      response_format: { type: "json_object" }
    });

    // Captura de Usage (Tokens)
    const usage = completion.usage || {};
    const content = JSON.parse(completion.choices[0].message.content);

    // Retornamos os dados mapeados exatamente como o Controller espera
    return {
      ...content,
      aiProvider: selected.name,
      aiModel: selected.model,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      }
    };

  } catch (error) {
    console.error(`❌ Erro no AI Service (${provider}):`, error.message);
    throw error;
  }
};

module.exports = { generateCourseContent };