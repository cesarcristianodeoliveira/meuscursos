const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.0.1
 * Especializado em Cursos Livres e Micro-learning.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  const strategy = {
    iniciante: "Introdução rápida, conceitos base e vitórias rápidas para o aluno.",
    intermediario: "Foco em ferramentas, métodos e aplicação em cenários reais.",
    avancado: "Análise crítica, resolução de problemas complexos e otimização."
  }[level];

  const systemPrompt = `Você é um Designer Instrucional Expert em Cursos Livres e EAD.
    Sua missão é criar uma experiência de aprendizado fluida, profunda e altamente engajadora.
    
    DIRETRIZES TÉCNICAS:
    1. CURSOS NÃO REGULAMENTADOS: Foque em habilidades práticas e competências diretas.
    2. MICRO-LEARNING: Divida o conhecimento em doses que mantenham o interesse.
    3. MARKDOWN: Use obrigatoriamente títulos (##, ###), listas, negrito e blocos de código.
    
    DIRETRIZES DE IMAGEM (CRÍTICO):
    - O campo "imageSearchPrompt" deve conter exatamente 3 a 5 palavras-chave em INGLÊS.
    - REVISÃO ORTOGRÁFICA: Você deve garantir que as palavras em inglês estejam escritas corretamente (ex: "language", não "lnguge").
    - FOCO NO TEMA: As palavras devem representar o CONCEITO GLOBAL do curso. 
    - PROIBIÇÃO: Não use termos que apareçam apenas em exemplos de frases ou exercícios (ex: se o curso é de Inglês e há um exemplo sobre 'cachorro', NÃO use 'dog' no prompt de imagem).`;

  const userPrompt = `Gere um curso completo sobre o tema: "${topic}".
    Nível: ${level}.
    Objetivo Pedagógico: ${strategy}

    REGRAS DE ESTRUTURA:
    - Módulos: De 3 a 8 módulos para garantir profundidade.
    - Conteúdo: Cada aula deve ser extensa, rica em detalhes e exemplos (mínimo de 500 palavras por aula).
    - Qualidade: Evite repetições e garanta que o tom seja profissional e motivador.

    RETORNE RIGOROSAMENTE NESTE FORMATO JSON:
    {
      "title": "Título Impactante",
      "description": "Uma descrição que convide o aluno a se matricular",
      "categoryName": "Categoria Principal",
      "tags": ["Tag1", "Tag2"],
      "imageSearchPrompt": "accurate english keywords for professional photography",
      "modules": [
        {
          "title": "Título do Módulo",
          "lessons": [{ "title": "Título da Aula", "content": "Conteúdo rico em Markdown", "duration": 0 }],
          "exercises": [{ "question": "Pergunta do Quiz", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }]
        }
      ],
      "finalExam": [{ "question": "Pergunta Final", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }]
    }`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: provider,
      temperature: 0.6, // Reduzido levemente para maior precisão ortográfica
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- CÁLCULO DE MÉTRICAS DINÂMICO ---
    let totalWords = 0;
    let totalLessons = 0;
    let totalQuizzes = 0;

    rawData.modules.forEach(mod => {
      totalQuizzes += (mod.exercises?.length || 0);
      mod.lessons.forEach(lesson => {
        const words = (lesson.content || "").trim().split(/\s+/).length;
        totalWords += words;
        totalLessons++;
        lesson.duration = Math.max(5, Math.ceil(words / 130));
      });
    });

    const totalExamQuestions = rawData.finalExam?.length || 0;
    const readingTime = Math.ceil(totalWords / 130);
    const quizTime = Math.ceil((totalQuizzes + totalExamQuestions) * 1.5);
    const totalDuration = readingTime + quizTime;

    // Cálculo de XP proporcional ao esforço e nível
    const levelMultiplier = { iniciante: 1, intermediario: 1.5, avancado: 2 }[level] || 1;
    const baseScore = (totalWords / 10) + ((totalQuizzes + totalExamQuestions) * 20);
    const finalXpReward = Math.round(baseScore * levelMultiplier);

    return {
      course: {
        ...rawData,
        estimatedTime: totalDuration,
        xpReward: finalXpReward
      },
      usage: {
        totalTokens: chatCompletion.usage?.total_tokens || 0,
        model: provider
      }
    };

  } catch (error) {
    console.error("❌ Erro fatal no aiService:", error.message);
    throw new Error("Erro ao gerar conteúdo dinâmico via IA.");
  }
};

module.exports = { generateCourseContent };