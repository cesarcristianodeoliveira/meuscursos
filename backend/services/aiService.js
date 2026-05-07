const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.2.0
 * Foco: Ortografia rigorosa, Variabilidade de Módulos e Métricas Dinâmicas.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  const strategy = {
    iniciante: "Introdução rápida, conceitos base e vitórias rápidas para o aluno. Linguagem simples.",
    intermediario: "Foco em ferramentas, métodos e aplicação em cenários reais. Conteúdo técnico denso.",
    avancado: "Análise crítica, resolução de problemas complexos e otimização profunda."
  }[level];

  const systemPrompt = `Você é um Designer Instrucional Expert e sua saída deve ser um JSON impecável.

    DIRETRIZES DE CONTEÚDO:
    1. DENSIDADE: Cada lição deve ser profunda (min 300 palavras). Use exemplos práticos.
    2. VARIABILIDADE: Não gere sempre a mesma quantidade de módulos. Escolha entre 3 a 5 conforme o tema.
    3. CONSISTÊNCIA: Quizzes devem refletir o conteúdo das lições.

    DIRETRIZES DE IMAGEM E ORTOGRAFIA (CRÍTICO):
    1. O campo "imageSearchPrompt" DEVE estar em inglês e ter a ortografia PERFEITA. 
    2. Revise se escreveu corretamente (ex: "Language" em vez de "lnguge").
    3. Use termos concretos e únicos: "Laboratory", "Code", "Architecture", "Healthy food".
    4. Proibido usar: "course", "lesson", "education", "online", "photo", "image".

    DIRETRIZES DE TEMPO:
    - Atribua "duration" em minutos para cada aula de forma realista (entre 5 e 15 min).`;

  const userPrompt = `Gere um curso profissional sobre: "${topic}".
    Nível: ${level}.
    Estratégia: ${strategy}

    ESTRUTURA:
    - Escolha entre 3 a 5 módulos.
    - Mínimo 2 lições por módulo.
    - 1 Pergunta por módulo + Exame Final (5 questões).

    RETORNE EM JSON:
    {
      "title": "Título impactante",
      "description": "Descrição profissional",
      "categoryName": "Categoria Curta (Ex: Idiomas, TI, Culinária)", 
      "tags": ["Tag1", "Tag2"],
      "imageSearchPrompt": "Single concrete English noun with perfect spelling",
      "modules": [
        {
          "title": "Módulo X",
          "lessons": [{ "title": "Aula X", "content": "Markdown (min 300 palavras)", "duration": 8 }],
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
      temperature: 0.8, // Aumentado para 0.8 para maior variabilidade criativa
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- PROCESSAMENTO DE MÉTRICAS DINÂMICAS ---
    let readingTime = 0;
    let quizCount = 0;

    rawData.modules.forEach(mod => {
      quizCount += (mod.exercises?.length || 0);
      mod.lessons.forEach(lesson => {
        // Validação de tempo mínima: 1 min para cada 150 palavras
        const words = (lesson.content || "").trim().split(/\s+/).length;
        const minTimeByWords = Math.ceil(words / 150);
        
        // Usa o maior entre o sugerido pela IA e o calculado por palavras
        lesson.duration = Math.max(lesson.duration || 5, minTimeByWords);
        readingTime += lesson.duration;
      });
    });

    const examCount = rawData.finalExam?.length || 0;
    
    // Duração total real
    const estimatedTotalTime = readingTime + ((quizCount + examCount) * 2);

    // Recompensa de XP baseada no esforço (Minutos de estudo * multiplicadores)
    const levelBonus = { iniciante: 10, intermediario: 13, avancado: 16 }[level];
    const finalXpReward = estimatedTotalTime * levelBonus;

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
    console.error("❌ Erro no aiService:", error.message);
    throw new Error("Erro na geração do curso via IA.");
  }
};

module.exports = { generateCourseContent };