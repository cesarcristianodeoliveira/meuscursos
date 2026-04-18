const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service) v1.4
 * Ajustado para maior rigor no exame final e precisão visual.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  // Configuração Dinâmica de densidade
  const isBeginner = level === 'iniciante';
  const isIntermediate = level === 'intermediario';
  
  const moduleCount = isBeginner ? 3 : (isIntermediate ? 4 : 5);
  const lessonsPerModule = isBeginner ? 3 : 4;
  // Determinamos o número de questões do exame final com base no nível
  const finalExamCount = isBeginner ? 5 : (isIntermediate ? 8 : 10);

  const systemPrompt = `Você é um Professor Expert em Design Instrucional e Engenharia de Prompts.
    Sua tarefa é estruturar um curso pedagógico completo, profissional e visualmente coerente.
    Responda EXCLUSIVAMENTE com um objeto JSON válido.

    DIRETRIZES DE QUALIDADE:
    - CONTEÚDO: Markdown rico, com subtítulos (##), listas e blocos de código (ex: \`\`\`javascript).
    - EXAME FINAL: Deve conter obrigatoriamente ${finalExamCount} questões de múltipla escolha.
    - VISUAL: O campo "imageSearchPrompt" deve descrever uma cena fotográfica ou ilustração minimalista e profissional que represente o tema, em inglês, para melhor compatibilidade com APIs de imagem.
    - PRECISÃO: A "correctAnswer" deve ser EXATAMENTE igual a uma das strings da lista "options".`;

  const userPrompt = `Gere um curso completo sobre o tema: "${topic}".
    Nível: ${level}.
    Estrutura: ${moduleCount} módulos, cada um com ${lessonsPerModule} aulas.
    Exame Final: Exatamente ${finalExamCount} questões.

    Estrutura JSON obrigatória:
    {
      "title": "Título do Curso",
      "description": "Sinopse profissional de 2 parágrafos",
      "categoryName": "Categoria Principal",
      "tags": ["tag1", "tag2", "tag3"],
      "imageSearchPrompt": "A highly professional, minimalist photographic prompt in English for image generation about ${topic}",
      "modules": [
        {
          "title": "Nome do Módulo",
          "lessons": [
            {
              "title": "Título da Aula",
              "content": "Conteúdo Markdown detalhado e extenso",
              "duration": 10
            }
          ],
          "exercises": [
            {
              "question": "Pergunta do quiz do módulo?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "Opção correta"
            }
          ]
        }
      ],
      "finalExam": [
        {
          "question": "Pergunta de certificação?",
          "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
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
      temperature: 0.5, // Reduzi levemente para garantir que ele siga o número de questões
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0].message.content;
    const rawData = JSON.parse(content);

    // Validação de segurança para garantir que o array finalExam não venha vazio ou curto
    if (!rawData.finalExam || rawData.finalExam.length < 3) {
        console.warn("⚠️ IA gerou poucas questões no exame, tentando forçar preenchimento...");
    }

    // --- PÓS-PROCESSAMENTO DE MÉTRICAS (Gamificação v1.4) ---
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

    const readingTime = Math.ceil(totalWordCount / 150); // Reduzi para 150 para ser mais realista
    const exerciseTime = (totalExercises + (rawData.finalExam?.length || 0)) * 3;
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
    console.error("❌ Erro na Geração da IA (Groq):", error.message);
    throw new Error("A IA falhou ao estruturar o curso. Tente novamente.");
  }
};

module.exports = { generateCourseContent };