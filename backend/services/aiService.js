const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.1.0
 * Foco: Metadados reais, Imagens precisas e Densidade Pedagógica.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  const strategy = {
    iniciante: "Introdução rápida, conceitos base e vitórias rápidas para o aluno.",
    intermediario: "Foco em ferramentas, métodos e aplicação em cenários reais. Conteúdo técnico denso.",
    avancado: "Análise crítica, resolução de problemas complexos e otimização profunda."
  }[level];

  const systemPrompt = `Você é um Designer Instrucional Expert. 
    Sua missão é criar cursos que entreguem valor real e técnico.

    DIRETRIZES DE CONTEÚDO:
    1. DENSIDADE: Cada lição deve ter no mínimo 300 palavras de conteúdo útil. Não seja superficial.
    2. CONSISTÊNCIA: Tudo o que for perguntado nos Quizzes DEVE estar explicado no texto das aulas.
    3. MARKDOWN: Use (##, ###), tabelas e negritos. Formate códigos em blocos apropriados.

    DIRETRIZES DE IMAGEM (ESTRITAMENTE EM INGLÊS):
    1. O campo "imageSearchPrompt" deve ser baseado UNICAMENTE na categoria principal ou no objeto central do curso.
    2. NÃO use adjetivos subjetivos como "soltinho", "melhor" ou "incrível".
    3. Use termos de alta fidelidade visual. Exemplo: "Cooking", "Microbiology", "Cybersecurity", "Excel spreadsheet".
    4. FOCO: 1 a 2 palavras-chave no máximo para garantir precisão na busca por APIs externas.`;

  const userPrompt = `Gere um curso completo sobre: "${topic}".
    Nível: ${level}.
    Estratégia: ${strategy}

    ESTRUTURA:
    - Módulos: De 3 a 5 módulos bem definidos.
    - Lições: Mínimo 2 aulas por módulo.
    - Quizzes: 1 pergunta técnica por módulo.
    - Exame Final: 5 questões abrangentes.

    RETORNE EM JSON:
    {
      "title": "Título",
      "description": "Descrição",
      "categoryName": "Categoria Principal", 
      "tags": ["Tag1", "Tag2"],
      "imageSearchPrompt": "Single English word or simple term",
      "modules": [
        {
          "title": "Módulo",
          "lessons": [{ "title": "Aula", "content": "Markdown (min 300 palavras)", "duration": 0 }],
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
      temperature: 0.6, // Ligeiramente maior para criatividade no conteúdo textual
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- PROCESSAMENTO DE MÉTRICAS ---
    let totalWords = 0;
    let readingTime = 0;
    let quizCount = 0;

    rawData.modules.forEach(mod => {
      quizCount += (mod.exercises?.length || 0);
      mod.lessons.forEach(lesson => {
        const words = (lesson.content || "").trim().split(/\s+/).length;
        totalWords += words;
        
        // Média de leitura: 150 palavras por minuto para conteúdo técnico
        const calcDur = Math.max(5, Math.ceil(words / 150));
        lesson.duration = calcDur;
        readingTime += calcDur;
      });
    });

    const examCount = rawData.finalExam?.length || 0;
    
    // Duração total = tempo de leitura + 2 min por questão de quiz/exame
    const estimatedTotalTime = readingTime + ((quizCount + examCount) * 2);

    // Recompensa de XP balanceada (XP por minuto + bônus de complexidade)
    const levelBonus = { iniciante: 1, intermediario: 1.3, avancado: 1.6 }[level];
    const finalXpReward = Math.round((estimatedTotalTime * 10) * levelBonus);

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