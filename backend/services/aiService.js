const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSystemPrompt = (level) => {
  const isBeginner = level === 'iniciante';

  // Regras Dinâmicas baseadas no nível para garantir realismo
  const moduleCount = isBeginner ? "EXATAMENTE 3 módulos" : "entre 4 a 6 módulos densos";
  const exerciseRule = isBeginner 
    ? "Cada módulo deve conter EXATAMENTE 1 exercício de múltipla escolha."
    : "Cada módulo deve conter EXATAMENTE 3 exercícios de múltipla escolha.";
  
  const examRule = isBeginner ? "5 perguntas" : "10 perguntas";
  const tagRule = isBeginner ? "1 a 3 tags" : "EXATAMENTE 5 tags";

  return `Você é um Designer Instrucional Especialista. Crie um curso técnico no formato JSON seguindo estas diretrizes:

DIRETRIZES PEDAGÓGICAS:
1. ESTRUTURA: Gere ${moduleCount}.
2. EXERCÍCIOS: ${exerciseRule}
3. EXAME FINAL: Crie a seção 'finalExam' com ${examRule}.
4. TAGS: Array 'tags' com ${tagRule}. NUNCA use pontuação ou hashtags.
5. BUSCA DE IMAGEM: O campo 'searchQuery' deve conter 1 ou 2 termos em INGLÊS que representem visualmente o tópico (ex: "server hardware", "coding laptop").
6. TEMPO: 'estimatedTime' deve refletir a carga horária real (ex: Iniciante = 1 a 2h, Avançado = 5 a 10h).

JSON SCHEMA OBRIGATÓRIO:
{
  "title": "string",
  "category": { "name": "string", "slug": "string" },
  "description": "string (mínimo 300 caracteres)",
  "rating": 0,
  "estimatedTime": number,
  "level": "${level}",
  "tags": [],
  "searchQuery": "string",
  "modules": [
    { 
      "title": "string", 
      "content": "Markdown detalhado...",
      "exercises": [ 
        { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "texto exato da opção" } 
      ]
    }
  ],
  "finalExam": [ 
    { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "texto exato da opção" } 
  ]
}`;
};

const generateCourseContent = async (topic, provider = 'groq', options = {}) => {
  const { level = 'iniciante' } = options;

  const config = {
    groq: { name: 'Groq', model: 'llama-3.3-70b-versatile' },
    openai: { name: 'OpenAI', model: 'gpt-4o' }
  };

  const selected = config[provider] || config.groq;

  try {
    if (!process.env.GROQ_API_KEY) throw new Error("API_KEY_MISSING");

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: getSystemPrompt(level) },
        { role: 'user', content: `Gere um curso completo sobre o tópico: "${topic}" para nível ${level}.` }
      ],
      model: selected.model,
      temperature: 0.6,
      max_tokens: 8000, 
      response_format: { type: "json_object" }
    });

    const usage = completion.usage || {};
    let content = JSON.parse(completion.choices[0].message.content);

    // --- PÓS-PROCESSAMENTO E HIGIENIZAÇÃO ---
    
    // 1. Limpeza de Tags (Garante a regra do iniciante ter no máximo 3)
    if (Array.isArray(content.tags)) {
      content.tags = content.tags
        .map(tag => tag.replace(/[#.:.;?!]/g, '').trim())
        .filter(tag => tag.length > 0);
      
      if (level === 'iniciante' && content.tags.length > 3) {
        content.tags = content.tags.slice(0, 3);
      }
    }

    // 2. Ajuste de Realismo no Tempo (Se a IA falhar no cálculo)
    if (!content.estimatedTime || content.estimatedTime < 1) {
      content.estimatedTime = level === 'iniciante' ? 2 : 5;
    }

    // 3. Garantia de Rating Zero para cursos novos
    content.rating = 0;

    return {
      ...content,
      aiProvider: selected.name,
      aiModel: selected.model,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error(`❌ Erro no AI Service (${provider}):`, error.message);
    throw error;
  }
};

module.exports = { generateCourseContent };