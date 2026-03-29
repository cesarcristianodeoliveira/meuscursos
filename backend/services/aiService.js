const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSystemPrompt = (level) => {
  const isBeginner = level === 'iniciante';

  // Regras Dinâmicas baseadas no nível
  const moduleCount = isBeginner ? "EXATAMENTE 3 módulos" : "entre 4 a 6 módulos densos";
  const exerciseRule = isBeginner 
    ? "EXERCÍCIOS: Cada módulo deve conter EXATAMENTE 1 exercício de múltipla escolha."
    : "EXERCÍCIOS: Cada módulo deve conter EXATAMENTE 3 exercícios de múltipla escolha.";
  
  const examRule = isBeginner ? "5 perguntas" : "10 a 15 perguntas";
  const tagRule = isBeginner ? "entre 1 a 3 palavras-chave" : "EXATAMENTE 5 palavras-chave";

  return `Você é um Designer Instrucional Sênior e Especialista em EAD. 
Crie um curso online de alta retenção no formato JSON seguindo estas diretrizes:

REGRAS DE ESTRUTURA E PEDAGOGIA:
1. QUANTIDADE: Gere ${moduleCount}.
2. DENSIDADE: Conteúdo técnico em Markdown, focado em clareza e exemplos práticos.
3. ${exerciseRule}
4. PROVA FINAL: Crie a seção 'finalExam' com ${examRule}.
5. TAGS: Crie um array 'tags' com ${tagRule}. NUNCA use pontuação. Use apenas termos limpos (ex: ["Marcenaria", "Design"]).
6. RATING: O campo 'rating' deve ser sempre 0 (zero), pois o curso é novo.
7. IMAGEM: 'searchQuery' deve conter de 1 a 2 termos em INGLÊS que representem o objeto físico ou a ação principal do curso para busca de fotos (ex: "woodworking tools", "web coding"). Evite termos abstratos como "learning" ou "education".

ESTRUTURA JSON OBRIGATÓRIA:
{
  "title": "string",
  "category": { "name": "string", "slug": "string" },
  "description": "string (+300 caracteres)",
  "rating": 0,
  "estimatedTime": 1,
  "level": "${level}",
  "tags": [],
  "searchQuery": "string",
  "modules": [
    { 
      "title": "string", 
      "content": "Markdown...",
      "exercises": [ 
        { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "texto exato da opção correta" } 
      ]
    }
  ],
  "finalExam": [ 
    { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "texto exato da opção correta" } 
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
        { role: 'user', content: `Gere um curso técnico de nível ${level} sobre o tópico: "${topic}".` }
      ],
      model: selected.model,
      temperature: 0.5, // Reduzi levemente a temperatura para maior aderência ao JSON
      max_tokens: 8000, 
      response_format: { type: "json_object" }
    });

    const usage = completion.usage || {};
    const content = JSON.parse(completion.choices[0].message.content);

    // --- PÓS-PROCESSAMENTO E LIMPEZA ---
    
    // 1. Limpeza e Validação de Tags
    if (Array.isArray(content.tags)) {
      content.tags = content.tags
        .map(tag => tag.replace(/[:.;?!]/g, '').trim())
        .filter(tag => tag.length > 0);
      
      // Garante o limite físico no código além do prompt
      if (level === 'iniciante' && content.tags.length > 3) {
        content.tags = content.tags.slice(0, 3);
      }
    }

    // 2. Fallback de Rating (Realismo)
    content.rating = 0;

    return {
      ...content,
      aiProvider: selected.name,
      aiModel: selected.model,
      level: level, // Garante que o nível vindo do Controller seja respeitado
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