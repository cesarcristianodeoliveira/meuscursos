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
    let completion;

    if (provider === 'groq' || !provider) {
      // Verificação de segurança da chave
      if (!process.env.GROQ_API_KEY) throw new Error("API_KEY_MISSING");

      completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Gere um curso técnico exaustivo sobre: "${topic}".` }
        ],
        model: selected.model,
        temperature: 0.5, 
        max_tokens: 8000, 
        response_format: { type: "json_object" }
      });
    }

    const content = JSON.parse(completion.choices[0].message.content);
    
    return {
      ...content,
      aiProvider: selected.name,
      aiModel: selected.model
    };

  } catch (error) {
    // --- TRATAMENTO DE COTAS E ERROS ESPECÍFICOS ---
    
    // Erro 429: Too Many Requests (Limite de cota atingido)
    if (error.status === 429 || (error.message && error.message.includes('rate_limit'))) {
      const quotaError = new Error("QUOTA_EXCEEDED");
      quotaError.status = 429;
      quotaError.provider = provider;
      throw quotaError;
    }

    // Erro de Autenticação
    if (error.status === 401) {
      throw new Error("AUTH_ERROR");
    }

    console.error(`Erro crítico no AI Service (${provider}):`, error.message);
    throw error;
  }
};

module.exports = { generateCourseContent };