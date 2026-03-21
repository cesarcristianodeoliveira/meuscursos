const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Você é um Designer Instrucional Sênior e Especialista em EAD. 
Crie um curso online de alta retenção no formato JSON seguindo estas diretrizes:

REGRAS DE ESTRUTURA E PEDAGOGIA:
1. QUANTIDADE: Gere entre 4 a 6 módulos densos.
2. DENSIDADE: Cada módulo deve ser exaustivo, com conteúdo técnico em Markdown (use tabelas, listas e blocos de código).
3. EXERCÍCIOS: Cada módulo deve conter EXATAMENTE 3 exercícios de fixação de múltipla escolha.
4. PROVA FINAL: Crie uma seção 'finalExam' com no MÍNIMO 10 e no MÁXIMO 20 perguntas que cubram todo o curso.
5. RESPOSTAS: O campo 'correctAnswer' deve ser o texto EXATAMENTE IDÊNTICO a uma das opções do array 'options'.
6. RATING: Atribua uma nota de 0.0 a 5.0 (ex: 4.8).
7. IMAGEM: 'searchQuery' deve conter 2 substantivos concretos em inglês para busca de fotos.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "title": "string",
  "categoryName": "string",
  "pixabay_category": "string",
  "searchQuery": "string",
  "description": "string (+300 caracteres)",
  "rating": number,
  "modules": [
    { 
      "title": "string", 
      "content": "Markdown...",
      "exercises": [ { "question": "string", "options": [], "correctAnswer": "string" } ]
    }
  ],
  "finalExam": [ { "question": "string", "options": [], "correctAnswer": "string" } ]
}`;

const generateCourseContent = async (topic, provider = 'groq') => {
  const config = {
    groq: { name: 'Groq', model: 'llama-3.3-70b-versatile' },
    openai: { name: 'OpenAI', model: 'gpt-4o' }
  };

  const selected = config[provider] || config.groq;

  try {
    if (!process.env.GROQ_API_KEY) throw new Error("API_KEY_MISSING");

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Gere um curso técnico exaustivo sobre: "${topic}".` }
      ],
      model: selected.model,
      temperature: 0.5, 
      max_tokens: 8000, 
      response_format: { type: "json_object" }
    });

    const headers = completion.response?.headers; 
    
    const remainingTokensStr = headers?.get('x-ratelimit-remaining-tokens');
    const remainingRequestsStr = headers?.get('x-ratelimit-remaining-requests');
    const resetTime = headers?.get('x-ratelimit-reset-tokens') || '1m';

    const tokensRestantes = parseInt(remainingTokensStr);
    
    // Calibragem: 6000 é a média real de um curso de 5 módulos + prova
    const cursosEstimados = isNaN(tokensRestantes) ? 10 : Math.floor(tokensRestantes / 6000);

    const content = JSON.parse(completion.choices[0].message.content);
    
    return {
      ...content,
      aiProvider: selected.name,
      aiModel: selected.model,
      // AJUSTE CRÍTICO: Mapeamos para CamelCase para o Sanity/Backend somarem corretamente
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      },
      limits: {
        remainingTokens: tokensRestantes || 'N/A',
        remainingRequests: remainingRequestsStr || 'N/A',
        resetTime: resetTime,
        estimatedCoursesLeft: Math.max(0, cursosEstimados)
      }
    };

  } catch (error) {
    if (error.status === 429 || (error.message && error.message.includes('rate_limit'))) {
      const quotaError = new Error("QUOTA_EXCEEDED");
      quotaError.status = 429;
      quotaError.provider = provider;
      quotaError.resetTime = error.headers?.['retry-after'] || error.headers?.['x-ratelimit-reset-requests'] || "1m";
      throw quotaError;
    }

    if (error.status === 401) throw new Error("AUTH_ERROR");

    console.error(`❌ Erro crítico no AI Service (${provider}):`, error.message);
    throw error;
  }
};

module.exports = { generateCourseContent };