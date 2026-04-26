const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.0.0-rc1
 * Especializado em Cursos Livres (Não Regulamentados) e Micro-learning.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  // Em vez de números fixos, passamos "objetivos pedagógicos" para a IA
  const strategy = {
    iniciante: "Introdução rápida, conceitos base e vitórias rápidas para o aluno.",
    intermediario: "Foco em ferramentas, métodos e aplicação em cenários reais.",
    avancado: "Análise crítica, resolução de problemas complexos e otimização."
  }[level];

  const systemPrompt = `Você é um Designer Instrucional Expert em Cursos Livres e EAD.
    Sua missão é criar uma experiência de aprendizado fluida, não repetitiva e altamente engajadora.
    
    DIRETRIZES EAD:
    1. CURSOS NÃO REGULAMENTADOS: Foque em habilidades práticas e competências diretas.
    2. MICRO-LEARNING: Divida o conhecimento em doses que mantenham o interesse.
    3. MARKDOWN: Use títulos (##, ###), listas e blocos de código para facilitar a leitura em telas.
    4. IMAGEM: "imageSearchPrompt" deve ser 3 termos em INGLÊS que representem o tema de forma profissional.`;

  const userPrompt = `Gere um curso completo sobre: "${topic}".
    Nível: ${level}.
    Objetivo: ${strategy}

    REGRAS DE ESTRUTURA DINÂMICA:
    - Módulos: Crie a quantidade necessária para cobrir o tema com qualidade (Sugerido entre 3 a 8 módulos).
    - Aulas: Cada módulo deve ter uma quantidade variável de aulas, dependendo da profundidade do subtema.
    - Conteúdo: Cada aula deve ser profunda (mínimo de 500 palavras) e formatada em Markdown.
    - Quizzes: Cada módulo deve ter exercícios que validem o conhecimento daquele bloco.
    - Exame Final: Questões que cubram o curso todo.

    RETORNE NESTE FORMATO JSON:
    {
      "title": "Título Criativo",
      "description": "Pitch de vendas do curso",
      "categoryName": "Categoria",
      "tags": ["tag1", "tag2"],
      "imageSearchPrompt": "keywords in english",
      "modules": [
        {
          "title": "string",
          "lessons": [{ "title": "string", "content": "markdown", "duration": 0 }],
          "exercises": [{ "question": "string", "options": ["a", "b", "c", "d"], "correctAnswer": "a" }]
        }
      ],
      "finalExam": [{ "question": "string", "options": ["a", "b", "c", "d"], "correctAnswer": "a" }]
    }`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: provider,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- CÁLCULO DE MÉTRICAS 100% DINÂMICO (PÓS-IA) ---
    let totalWords = 0;
    let totalLessons = 0;
    let totalQuizzes = 0;

    rawData.modules.forEach(mod => {
      totalQuizzes += (mod.exercises?.length || 0);
      mod.lessons.forEach(lesson => {
        const words = (lesson.content || "").trim().split(/\s+/).length;
        totalWords += words;
        totalLessons++;
        
        // Duração por aula: 1 minuto para cada 130 palavras (leitura atenta em EAD)
        lesson.duration = Math.max(5, Math.ceil(words / 130));
      });
    });

    const totalExamQuestions = rawData.finalExam?.length || 0;
    
    // Tempo Total = Leitura + Tempo de Resolução (1.5 min por questão)
    const readingTime = Math.ceil(totalWords / 130);
    const quizTime = Math.ceil((totalQuizzes + totalExamQuestions) * 1.5);
    const totalDuration = readingTime + quizTime;

    /**
     * CÁLCULO DE XP (JUSTO E DINÂMICO)
     * Não usamos mais XP fixo. O XP é proporcional ao esforço:
     * - Cada 100 palavras = 10 XP (Valoriza a leitura)
     * - Cada Questão = 20 XP (Valoriza o desafio)
     * - Bônus de Nível: Iniciante (1x), Intermediário (1.5x), Avançado (2x)
     */
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
    throw new Error("Erro ao gerar conteúdo dinâmico.");
  }
};

module.exports = { generateCourseContent };