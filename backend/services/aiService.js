const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.0.2
 * Foco: Consistência Pedagógica, Metadados Reais e Imagens Precisas.
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

    DIRETRIZES TÉCNICAS DE CONTEÚDO:
    1. CONSISTÊNCIA PEDAGÓGICA (CRÍTICO): 100% das respostas corretas dos Quizzes e do Exame Final DEVEM estar explicadas explicitamente no texto das lições. Não pergunte nada que não foi ensinado.
    2. EXAME FINAL: Deve ser uma avaliação abrangente. Não repita apenas as perguntas dos módulos; crie questões que integrem os conhecimentos de diferentes módulos.
    3. MARKDOWN: Use títulos (##, ###), listas, negrito e blocos de código para facilitar a leitura.
    4. EXTENSÃO: Cada aula deve ser rica em detalhes técnicos e exemplos práticos.

    DIRETRIZES DE IMAGEM (CAPA DO CURSO):
    1. O campo "imageSearchPrompt" deve conter 3 a 5 palavras-chave em INGLÊS.
    2. REVISÃO ORTOGRÁFICA: Verifique letra por letra (ex: "Italian", não "itlin").
    3. SEMÂNTICA: Foque em objetos reais, iluminação cinematográfica e fotografia profissional (ex: "Italian pasta, cinematic lighting, professional food photography").
    4. CATEGORIA: Use a categoria do curso como base para o prompt.`;

  const userPrompt = `Gere um curso completo sobre: "${topic}".
    Nível: ${level}.
    Objetivo: ${strategy}

    ESTRUTURA DESEJADA:
    - Módulos: De 3 a 8.
    - Lições por Módulo: Mínimo 2 aulas por módulo.
    - Quizzes: 1 pergunta por módulo (focada no conteúdo daquele módulo).
    - Exame Final: Mínimo de 5 perguntas variadas sobre todo o curso.

    RETORNE RIGOROSAMENTE NESTE FORMATO JSON:
    {
      "title": "Título do Curso",
      "description": "Descrição chamativa",
      "categoryName": "Categoria",
      "tags": ["Tag1", "Tag2"],
      "imageSearchPrompt": "3-5 english keywords for thumbnail",
      "modules": [
        {
          "title": "Título do Módulo",
          "lessons": [{ "title": "Título", "content": "Texto Markdown extenso", "duration": 0 }],
          "exercises": [{ "question": "Pergunta", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }]
        }
      ],
      "finalExam": [{ "question": "Pergunta Geral", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }]
    }`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: provider,
      temperature: 0.5, // Reduzido para diminuir alucinações e erros ortográficos
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- CÁLCULO DE MÉTRICAS DINÂMICO ---
    let totalWords = 0;
    let accumulatedDuration = 0;
    let totalQuestions = 0;

    rawData.modules.forEach(mod => {
      totalQuestions += (mod.exercises?.length || 0);
      mod.lessons.forEach(lesson => {
        const words = (lesson.content || "").trim().split(/\s+/).length;
        totalWords += words;
        
        // Cálculo de duração: média de 130 palavras por minuto + tempo base
        const calculatedDuration = Math.max(5, Math.ceil(words / 130));
        lesson.duration = calculatedDuration;
        accumulatedDuration += calculatedDuration;
      });
    });

    const totalExamQuestions = rawData.finalExam?.length || 0;
    const totalDuration = accumulatedDuration + Math.ceil((totalQuestions + totalExamQuestions) * 1.5);

    // Recompensa de XP baseada na complexidade real (palavras + questões)
    const levelMultiplier = { iniciante: 1, intermediario: 1.5, avancado: 2 }[level] || 1;
    const baseScore = (totalWords / 8) + ((totalQuestions + totalExamQuestions) * 25);
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
    throw new Error("Falha na geração inteligente do curso.");
  }
};

module.exports = { generateCourseContent };