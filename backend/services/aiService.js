const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.5
 * Ajustado para evitar códigos irrelevantes e otimizar busca de imagens por keywords.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  const isBeginner = level === 'iniciante';
  const isIntermediate = level === 'intermediario';
  
  const moduleCount = isBeginner ? 3 : (isIntermediate ? 4 : 5);
  const lessonsPerModule = isBeginner ? 3 : 4;
  const finalExamCount = isBeginner ? 5 : (isIntermediate ? 8 : 10);

  const systemPrompt = `Você é um Professor Expert em Design Instrucional.
    Sua tarefa é estruturar um curso pedagógico completo e profissional.
    Responda EXCLUSIVAMENTE com um objeto JSON válido.

    DIRETRIZES DE QUALIDADE:
    - CONTEÚDO: Markdown rico com subtítulos (##) e listas. 
    - CÓDIGO: Use blocos de código (ex: \`\`\`javascript) APENAS se o tema for programação ou tecnologia. Se o tema for culinária, artes ou outros, use apenas texto e tabelas Markdown.
    - VISUAL: No campo "imageSearchPrompt", retorne apenas 3 a 5 palavras-chave em INGLÊS que descrevam o objeto principal. Exemplo: "cooked rice bowl, kitchen" ou "javascript code, laptop". Nunca use frases longas.
    - PRECISÃO: A "correctAnswer" deve ser idêntica a uma das opções.`;

  const userPrompt = `Gere um curso completo sobre: "${topic}".
    Nível: ${level}.
    Estrutura: ${moduleCount} módulos, cada um com ${lessonsPerModule} aulas.
    Exame Final: Exatamente ${finalExamCount} questões.

    Estrutura JSON obrigatória:
    {
      "title": "Título do Curso",
      "description": "Sinopse profissional",
      "categoryName": "Categoria Principal",
      "tags": ["tag1", "tag2"],
      "imageSearchPrompt": "Keywords em inglês para o tema ${topic}",
      "modules": [
        {
          "title": "Módulo X",
          "lessons": [
            {
              "title": "Aula X",
              "content": "Conteúdo didático em Markdown",
              "duration": 10
            }
          ],
          "exercises": [
            {
              "question": "Pergunta?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "Opção correta"
            }
          ]
        }
      ],
      "finalExam": [
        {
          "question": "Pergunta?",
          "options": ["1", "2", "3", "4"],
          "correctAnswer": "Opção correta"
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
      temperature: 0.6, // Ajustado para manter criatividade com foco estrutural
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0].message.content;
    const rawData = JSON.parse(content);

    // --- PÓS-PROCESSAMENTO DE MÉTRICAS ---
    let totalWordCount = 0;
    let totalLessons = 0;
    let totalExercises = 0;

    rawData.modules.forEach(mod => {
      totalExercises += (mod.exercises?.length || 0);
      mod.lessons.forEach(lesson => {
        totalWordCount += (lesson.content || "").split(/\s+/).length;
        totalLessons++;
      });
    });

    const readingTime = Math.ceil(totalWordCount / 180); 
    const exerciseTime = (totalExercises + (rawData.finalExam?.length || 0)) * 2;
    const finalEstimatedTime = readingTime + exerciseTime;

    const baseXP = level === 'avancado' ? 1500 : (level === 'intermediario' ? 1000 : 600);
    const finalXpReward = baseXP + (totalLessons * 40) + (finalEstimatedTime * 2);

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
    console.error("❌ Erro na Geração da IA:", error.message);
    throw new Error("Falha ao gerar curso.");
  }
};

module.exports = { generateCourseContent };