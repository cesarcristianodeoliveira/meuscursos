const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.6
 * Otimizado para: 
 * 1. Consistência de XP e Tempo.
 * 2. Markdown compatível com UI Components.
 * 3. Keywords de imagem ultra-específicas.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  // Configurações dinâmicas por nível para guiar a IA
  const config = {
    iniciante: { modules: 3, lessons: 3, finalExams: 5, xpBase: 600 },
    intermediario: { modules: 4, lessons: 4, finalExams: 8, xpBase: 1000 },
    avancado: { modules: 5, lessons: 4, finalExams: 10, xpBase: 1500 }
  }[level] || { modules: 3, lessons: 3, finalExams: 5, xpBase: 600 };

  const systemPrompt = `Você é um Designer Instrucional Expert em Educação Digital.
    Sua tarefa é estruturar um curso pedagógico de alta qualidade.
    Responda EXCLUSIVAMENTE com um objeto JSON válido.

    DIRETRIZES DE QUALIDADE:
    - CONTEÚDO: Use Markdown rico. Sempre inclua um título (##) no início do conteúdo da aula e use (###) para subseções.
    - DIDÁTICA: Explique conceitos complexos de forma clara. Use listas (bullet points) para facilitar a leitura.
    - CÓDIGO: Use blocos de código com a linguagem especificada (ex: \`\`\`javascript) se o tema for técnico.
    - IMAGEM: O campo "imageSearchPrompt" deve conter apenas substantivos e adjetivos em INGLÊS que gerem fotos profissionais no Unsplash. Evite termos genéricos como "education" ou "course".
    - INTEGRIDADE: Certifique-se de que a "correctAnswer" seja idêntica a uma das opções na lista "options".`;

  const userPrompt = `Gere um curso completo sobre: "${topic}".
    Nível de dificuldade: ${level}.
    Estrutura exigida: ${config.modules} módulos, cada um com ${config.lessons} aulas.
    Exame Final: Exatamente ${config.finalExams} questões.

    Estrutura JSON obrigatória:
    {
      "title": "Título Impactante",
      "description": "Sinopse profissional para atrair alunos",
      "categoryName": "Categoria (ex: Tecnologia, Culinária, Business)",
      "tags": ["tag1", "tag2"],
      "imageSearchPrompt": "3 a 5 keywords em inglês",
      "modules": [
        {
          "title": "Nome do Módulo",
          "lessons": [
            {
              "title": "Nome da Aula",
              "content": "Conteúdo em Markdown (mínimo 400 palavras)",
              "duration": 10
            }
          ],
          "exercises": [
            {
              "question": "Pergunta do quiz?",
              "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
              "correctAnswer": "Opção 2"
            }
          ]
        }
      ],
      "finalExam": [
        {
          "question": "Pergunta do exame final?",
          "options": ["1", "2", "3", "4"],
          "correctAnswer": "3"
        }
      ]
    }`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: provider,
      temperature: 0.7, // Aumentado levemente para maior profundidade no conteúdo
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- PÓS-PROCESSAMENTO DE MÉTRICAS (Refinado) ---
    let totalWordCount = 0;
    let totalLessons = 0;
    let totalExercises = 0;

    rawData.modules.forEach(mod => {
      totalExercises += (mod.exercises?.length || 0);
      mod.lessons.forEach(lesson => {
        // Sanitização simples para contagem de palavras
        const cleanContent = (lesson.content || "").replace(/[#*`]/g, '');
        const wordCount = cleanContent.trim().split(/\s+/).length;
        
        totalWordCount += wordCount;
        totalLessons++;
        
        // Ajusta a duração da aula dinamicamente se a IA falhar na estimativa
        // Média de 150 palavras por minuto para leitura técnica
        const calculatedDuration = Math.max(5, Math.ceil(wordCount / 150));
        lesson.duration = calculatedDuration;
      });
    });

    // Tempo total: Leitura + 2 minutos por exercício
    const totalExamQuestions = rawData.finalExam?.length || 0;
    const estimatedReadingTime = Math.ceil(totalWordCount / 150);
    const estimatedActivityTime = (totalExercises + totalExamQuestions) * 2;
    const finalEstimatedTime = estimatedReadingTime + estimatedActivityTime;

    // Cálculo de XP baseado em esforço real e profundidade
    const finalXpReward = config.xpBase + (totalLessons * 50) + (finalEstimatedTime * 5);

    return {
      ...rawData,
      estimatedTime: finalEstimatedTime,
      xpReward: Math.round(finalXpReward),
      aiMetadata: {
        provider: 'Groq',
        model: provider,
        totalTokens: chatCompletion.usage?.total_tokens || 0,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error("❌ Erro na Geração da IA (aiService):", error.message);
    throw new Error("Não foi possível gerar o conteúdo do curso no momento.");
  }
};

module.exports = { generateCourseContent };