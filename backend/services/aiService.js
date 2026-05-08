const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.3.0
 * Foco: Qualidade visual, Progressão Instrucional e Métricas Reais.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  const strategy = {
    iniciante: "Introdução rápida, conceitos base e vitórias rápidas para o aluno. Linguagem simples e acolhedora.",
    intermediario: "Foco em ferramentas, métodos e aplicação em cenários reais. Conteúdo técnico denso e diagramas textuais.",
    avancado: "Análise crítica, resolução de problemas complexos, otimização profunda e cases de alto nível."
  }[level];

  const systemPrompt = `Você é um Designer Instrucional Senior. Sua saída deve ser um JSON impecável, seguindo rigorosamente estas diretrizes:

    DIRETRIZES DE CONTEÚDO (DENSIDADE MÁXIMA):
    1. LIÇÕES: Cada lição deve ser profunda (min 300-500 palavras). Use Markdown rico (títulos, listas, negrito).
    2. VARIABILIDADE: Escolha entre 3 a 5 módulos dependendo da complexidade do tema "${topic}".
    3. DIDÁTICA: Explique o "porquê" além do "como".

    DIRETRIZES VISUAIS (PARA PIXABAY):
    O campo "imageSearchPrompt" é a chave para o sucesso visual do curso.
    1. Use uma frase curta e descritiva em INGLÊS (ex: "Fresh Italian meatballs with pasta food photography").
    2. Adicione termos de estilo: "professional photography", "studio lighting", "high resolution".
    3. FOCO: O objeto principal deve estar no início da frase.
    4. EVITE: Palavras abstratas, textos na imagem ou termos como "online course", "education", "internet".

    DIRETRIZES DE TEMPO:
    - Atribua "duration" realista para cada aula (5 a 20 min).`;

  const userPrompt = `Gere um curso completo e profissional sobre: "${topic}".
    Nível: ${level}.
    Estratégia: ${strategy}

    ESTRUTURA OBRIGATÓRIA:
    - 3 a 5 módulos.
    - Mínimo 2 lições por módulo.
    - 1 Pergunta por módulo (quiz de fixação).
    - Exame Final com exatamente 5 questões desafiadoras.

    RESPOSTA EM JSON (SCHEMA):
    {
      "title": "Título impactante",
      "description": "Descrição profissional envolvente",
      "categoryName": "Categoria curta", 
      "tags": ["tag1", "tag2", "tag3"],
      "imageSearchPrompt": "Detailed descriptive English phrase for high-quality photography",
      "modules": [
        {
          "title": "Módulo X",
          "lessons": [{ "title": "Aula X", "content": "Markdown robusto", "duration": 10 }],
          "exercises": [{ "question": "P", "options": ["A","B","C","D"], "correctAnswer": "A" }]
        }
      ],
      "finalExam": [{ "question": "P", "options": ["A","B","C","D"], "correctAnswer": "A" }]
    }`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: provider,
      temperature: 0.7, // Reduzido levemente para manter a coerência técnica
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- PROCESSAMENTO DE MÉTRICAS E VALIDAÇÃO ---
    let totalMinutes = 0;
    let totalLessons = 0;

    rawData.modules.forEach(mod => {
      mod.lessons.forEach(lesson => {
        totalLessons++;
        // Estimativa real de leitura: ~200 palavras por minuto
        const words = (lesson.content || "").trim().split(/\s+/).length;
        const estimatedReadingTime = Math.ceil(words / 180); 

        // Garante que o tempo não seja ridículo (mínimo 5 min por aula densa)
        lesson.duration = Math.max(lesson.duration || 5, estimatedReadingTime, 5);
        totalMinutes += lesson.duration;
      });
    });

    // Tempo para Quizzes (2 min por questão)
    const totalQuizzes = (rawData.modules.length) + (rawData.finalExam?.length || 0);
    const estimatedTotalTime = totalMinutes + (totalQuizzes * 2);

    // Recompensa de XP (Leveling System)
    const levelMultipliers = { iniciante: 10, intermediario: 15, avancado: 20 };
    const finalXpReward = estimatedTotalTime * (levelMultipliers[level] || 10);

    return {
      course: {
        ...rawData,
        estimatedTime: estimatedTotalTime,
        xpReward: finalXpReward
      },
      usage: {
        totalTokens: chatCompletion.usage?.total_tokens || 0,
        model: provider
      }
    };

  } catch (error) {
    console.error("❌ Erro Crítico no aiService:", error.message);
    throw new Error("Falha na geração de conteúdo inteligente.");
  }
};

module.exports = { generateCourseContent };