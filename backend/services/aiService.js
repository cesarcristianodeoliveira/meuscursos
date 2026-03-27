const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Transformamos o Prompt em uma função para injetar as regras dinamicamente
const getSystemPrompt = (isFullAccess) => {
  const exerciseRule = isFullAccess 
    ? "EXERCÍCIOS: Cada módulo deve conter EXATAMENTE 3 exercícios de fixação de múltipla escolha."
    : "EXERCÍCIOS: Para este curso, o array 'exercises' DEVE estar vazio [].";

  return `Você é um Designer Instrucional Sênior e Especialista em EAD. 
Crie um curso online de alta retenção no formato JSON seguindo estas diretrizes:

REGRAS DE ESTRUTURA E PEDAGOGIA:
1. QUANTIDADE: Gere entre 4 a 6 módulos densos.
2. DENSIDADE: Cada módulo deve ser exaustivo, com conteúdo técnico em Markdown (use tabelas, listas e blocos de código).
3. ${exerciseRule}
4. PROVA FINAL: Crie uma seção 'finalExam' com no MÍNIMO 10 e no MÁXIMO 20 perguntas que cubram todo o curso (disponível para todos os níveis).
5. RESPOSTAS: O campo 'correctAnswer' deve ser o texto EXATAMENTE IDÊNTICO a uma das opções do array 'options'.
6. RATING: Atribua uma nota de 0.0 a 5.0 (ex: 4.8).
7. IMAGEM: 'searchQuery' deve conter 2 substantivos concretos em inglês para busca de fotos.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "title": "string",
  "category": { "name": "string", "slug": "string" },
  "description": "string (+300 caracteres)",
  "rating": number,
  "level": "${isFullAccess ? 'intermediario ou avancado' : 'iniciante'}",
  "searchQuery": "string",
  "modules": [
    { 
      "title": "string", 
      "content": "Markdown...",
      "exercises": [ 
        { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "A" } 
      ]
    }
  ],
  "finalExam": [ 
    { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "A" } 
  ]
}`;
};

const generateCourseContent = async (topic, provider = 'groq', options = {}) => {
  const { fullContent = false } = options; // Recebe o estado do Controller

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

    const usage = completion.usage || {};
    const content = JSON.parse(completion.choices[0].message.content);

    return {
      ...content,
      aiProvider: selected.name,
      aiModel: selected.model,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      },
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    if (error.status === 429 || error.message?.includes('rate_limit')) {
      const quotaError = new Error("QUOTA_EXCEEDED");
      quotaError.status = 429;
      quotaError.provider = provider;
      throw quotaError;
    }
    throw error;
  }
};

module.exports = { generateCourseContent };