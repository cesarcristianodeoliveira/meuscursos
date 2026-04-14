const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.3
 * Utiliza Llama 3.3 via Groq para gerar cursos estruturados com Aulas e Módulos.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  // Configuração Dinâmica: quanto maior o nível, mais denso o curso
  const isBeginner = level === 'iniciante';
  const isIntermediate = level === 'intermediario';
  
  const moduleCount = isBeginner ? 3 : (isIntermediate ? 4 : 5);
  const lessonsPerModule = isBeginner ? 3 : 4;

  const systemPrompt = `Você é um Professor Expert em Design Instrucional.
    Sua tarefa é estruturar um curso pedagógico completo e profissional.
    Responda EXCLUSIVAMENTE com um objeto JSON válido, sem textos antes ou depois.
    
    DIRETRIZES DE QUALIDADE:
    - O curso deve ser dividido em módulos, e cada módulo deve conter uma lista de aulas (lessons).
    - Cada aula (lesson) deve ter um conteúdo em Markdown rico, incluindo subtítulos (##), listas e exemplos práticos.
    - Se houver código, use blocos de código com a linguagem específica (ex: \`\`\`javascript).
    - Os títulos das aulas devem ser curtos e diretos (máximo 50 caracteres).
    - As opções de exercícios devem ser plausíveis, e a "correctAnswer" deve ser identica a uma das opções.`;

  const userPrompt = `Gere um curso completo sobre o tema: "${topic}".
    Nível: ${level}.
    Quantidade de módulos: ${moduleCount}.
    Cada módulo deve ter exatamente ${lessonsPerModule} aulas.

    Estrutura JSON obrigatória:
    {
      "title": "Título do Curso",
      "description": "Uma sinopse envolvente de 2 parágrafos",
      "categoryName": "Categoria Principal",
      "tags": ["tag1", "tag2", "tag3"],
      "modules": [
        {
          "title": "Nome do Módulo",
          "lessons": [
            {
              "title": "Título da Aula",
              "content": "Conteúdo Markdown detalhado",
              "duration": 5
            }
          ],
          "exercises": [
            {
              "question": "Pergunta do quiz?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "Opção correta aqui"
            }
          ]
        }
      ],
      "finalExam": [
        {
          "question": "Pergunta de certificação?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A"
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
      temperature: 0.6, // Balanço entre criatividade e estrutura
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0].message.content;
    const rawData = JSON.parse(content);

    // --- PÓS-PROCESSAMENTO DE MÉTRICAS (Gamificação v1.3) ---

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

    // Estimativa de tempo: 180 palavras por minuto + 4 min por exercício
    const readingTime = Math.ceil(totalWordCount / 180);
    const exerciseTime = (totalExercises + (rawData.finalExam?.length || 0)) * 4;
    const finalEstimatedTime = readingTime + exerciseTime;

    // Cálculo de XP: Complexidade + Extensão
    const baseXP = level === 'avancado' ? 1200 : (level === 'intermediario' ? 800 : 500);
    const finalXpReward = baseXP + (totalLessons * 30) + (finalEstimatedTime * 5);

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
    console.error("❌ Erro na Geração da IA (Groq):", error.message);
    throw new Error("A IA falhou ao estruturar o curso. Tente novamente em alguns instantes.");
  }
};

module.exports = { generateCourseContent };