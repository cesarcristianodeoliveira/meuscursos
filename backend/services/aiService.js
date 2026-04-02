const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service)
 * Responsável por estruturar o curso, gerar conteúdos e exercícios.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  // 1. Configuração de Regras Pedagógicas (Baseado na nossa discussão de realismo)
  const isBeginner = level === 'iniciante';
  const moduleCount = isBeginner ? 3 : 5;
  const exercisesPerModule = isBeginner ? 1 : 2;

  const prompt = `
    Você é um Professor Expert em Educação Online. Sua missão é criar um curso COMPLETO sobre: "${topic}".
    Nível do Aluno: ${level}.
    
    ESTRUTURA OBRIGATÓRIA (JSON estrito):
    {
      "title": "Título chamativo do curso",
      "description": "Uma introdução de 2 parágrafos motivadores",
      "categoryName": "Uma categoria curta (ex: Programação, Design)",
      "tags": ["Tag1", "Tag2"],
      "modules": [
        {
          "title": "Título do Módulo",
          "content": "Conteúdo denso em Markdown (mínimo 500 palavras) explicando conceitos, exemplos e práticas",
          "exercises": [
            {
              "question": "Pergunta de múltipla escolha",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "A frase exata da opção correta"
            }
          ]
        }
      ],
      "finalExam": [
        {
          "question": "Pergunta desafiadora",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A frase exata da opção correta"
        }
      ]
    }

    REGRAS CRÍTICAS:
    - Gere exatamente ${moduleCount} módulos.
    - Cada módulo deve ter ${exercisesPerModule} exercício(s).
    - O exame final deve ter 5 questões.
    - O conteúdo deve ser rico, usando negrito, listas e blocos de código se necessário.
    - Responda APENAS o JSON, sem textos extras antes ou depois.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: provider,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // 2. LÓGICA DE PÓS-PROCESSAMENTO (O Toque de Mestre)
    // Calculamos o tempo e XP baseados no conteúdo REAL gerado, não em chutes da IA.
    
    let totalWordCount = 0;
    rawData.modules.forEach(mod => {
      totalWordCount += mod.content.split(/\s+/).length;
    });

    // Velocidade média de leitura: 200 palavras por minuto
    // Adicionamos 2 minutos por exercício
    const readingTime = Math.ceil(totalWordCount / 200);
    const exerciseTime = (rawData.modules.length * exercisesPerModule * 2) + 10; // +10 do exame final
    const finalEstimatedTime = readingTime + exerciseTime;

    // Cálculo de XP: 10 XP por minuto de curso + 500 XP base de conclusão
    const finalXpReward = (finalEstimatedTime * 10) + 500;

    // 3. Montagem do Objeto Final para o Sanity
    return {
      ...rawData,
      estimatedTime: finalEstimatedTime,
      xpReward: finalXpReward,
      aiMetadata: {
        provider: 'Groq',
        model: provider,
        promptTokens: chatCompletion.usage?.prompt_tokens || 0,
        completionTokens: chatCompletion.usage?.completion_tokens || 0,
        totalTokens: chatCompletion.usage?.total_tokens || 0,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error("❌ Erro na Geração da IA:", error.message);
    throw new Error("A IA falhou em estruturar o curso. Tente novamente.");
  }
};

module.exports = { generateCourseContent };