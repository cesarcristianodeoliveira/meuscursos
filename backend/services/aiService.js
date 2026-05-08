const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.4.0
 * Foco: Engenharia de Prompt para Imagens Artísticas e Precisão de Métricas.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  const strategy = {
    iniciante: "Introdução rápida, conceitos base e vitórias rápidas. Linguagem simples e acolhedora.",
    intermediario: "Foco em ferramentas, métodos e aplicação real. Conteúdo técnico denso e diagramas textuais.",
    avancado: "Análise crítica, resolução de problemas complexos e otimização profunda."
  }[level];

  const systemPrompt = `Você é um Designer Instrucional Senior e Diretor de Arte. 
    Sua missão é gerar um curso em JSON que seja educacionalmente profundo e visualmente inspirador.

    DIRETRIZES DE CONTEÚDO:
    1. LIÇÕES: Mínimo de 400 palavras por aula. Use Markdown (###, **bold**, listas).
    2. DIDÁTICA: Aplique a técnica de 'Feynman' para explicar conceitos complexos de forma simples.

    DIRETRIZES DE DIRETOR DE ARTE (imageSearchPrompt):
    Este campo será usado para buscar imagens em bancos profissionais (Unsplash/Pexels). 
    NÃO use termos genéricos. Siga este template:
    - [Sujeito Principal] + [Ação/Contexto] + [Estilo Artístico] + [Iluminação]
    - Exemplo RUIM: "A photo of coffee"
    - Exemplo BOM: "Close-up of professional barista pouring latte art in a moody cinematic cafe, 8k resolution, macro photography, warm sunlight"
    - REGRAS: Sempre em INGLÊS. Sem textos na imagem. Sem palavras como 'curso', 'online', 'educação'.

    DIRETRIZES TÉCNICAS:
    - Retorne apenas o objeto JSON, sem textos explicativos fora do JSON.`;

  const userPrompt = `Crie um curso sobre: "${topic}".
    Nível: ${level}.
    Estratégia: ${strategy}

    ESTRUTURA:
    - 3 a 5 módulos.
    - Mínimo 2 lições por módulo (cada lição com campo 'duration' em minutos).
    - 1 Pergunta de múltipla escolha por módulo.
    - Exame Final com 5 questões.

    SCHEMA JSON:
    {
      "title": "Título",
      "description": "Descrição",
      "categoryName": "Categoria",
      "tags": ["tag1", "tag2"],
      "imageSearchPrompt": "Detailed English artistic prompt",
      "modules": [
        {
          "title": "Módulo",
          "lessons": [{ "title": "Aula", "content": "Markdown", "duration": 15 }],
          "exercises": [{ "question": "Q", "options": ["A","B","C","D"], "correctAnswer": "A" }]
        }
      ],
      "finalExam": [{ "question": "Q", "options": ["A","B","C","D"], "correctAnswer": "A" }]
    }`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: provider,
      temperature: 0.6, // Mais baixo para evitar alucinações no formato JSON
      response_format: { type: "json_object" }
    });

    let rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- PÓS-PROCESSAMENTO DE INTELIGÊNCIA ---
    let totalMinutes = 0;

    rawData.modules.forEach(mod => {
      mod.lessons.forEach(lesson => {
        // Validação de segurança: se a IA mandou pouco texto, forçamos uma duração mínima
        const wordCount = (lesson.content || "").split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 150); // Média de 150-200 palavras por minuto
        
        lesson.duration = Math.max(lesson.duration || 5, readingTime);
        totalMinutes += lesson.duration;
      });
    });

    // Tempo de Quiz: 2 min por questão
    const totalQuestions = rawData.modules.length + (rawData.finalExam?.length || 0);
    const finalEstimatedTime = totalMinutes + (totalQuestions * 2);

    // Cálculo de XP baseado no esforço (Duração + Nível)
    const levelBonus = { iniciante: 1, intermediario: 1.5, avancado: 2 };
    const xpReward = Math.round(finalEstimatedTime * 10 * (levelBonus[level] || 1));

    return {
      course: {
        ...rawData,
        estimatedTime: finalEstimatedTime,
        xpReward: xpReward
      },
      usage: {
        totalTokens: chatCompletion.usage?.total_tokens || 0,
        model: provider
      }
    };

  } catch (error) {
    console.error("❌ Erro no aiService:", error);
    throw new Error("A IA falhou em gerar o conteúdo. Tente um tema mais específico.");
  }
};

module.exports = { generateCourseContent };