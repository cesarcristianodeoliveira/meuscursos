const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service)
 * Utiliza o modelo Llama 3.3 via Groq para estruturar cursos completos v1.3.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  // Configuração Dinâmica baseada no nível
  const isBeginner = level === 'iniciante';
  const moduleCount = isBeginner ? 3 : 5;
  const lessonsPerModule = isBeginner ? 3 : 4; // Agora dividimos em aulas
  const exercisesPerModule = 1;

  const systemPrompt = `Você é um Professor Expert em Educação Online e Design Instrucional.
    Sua tarefa é estruturar um curso pedagógico completo, dividido em módulos e aulas.
    Você deve responder estritamente com um objeto JSON válido.
    
    REGRAS DE CONTEÚDO:
    - Divida cada módulo em pelo menos ${lessonsPerModule} aulas.
    - Cada aula deve ter conteúdo em Markdown rico (use ##, blocos de código, listas).
    - O tom deve ser didático e envolvente.
    - As "correctAnswer" devem ser a string exata de uma das opções.
    - O exame final deve abranger todo o conteúdo do curso.`;

  const userPrompt = `Crie um curso completo sobre: "${topic}". 
    O nível do curso é: ${level}.
    Gere exatamente ${moduleCount} módulos.
    
    Estrutura do JSON esperada:
    {
      "title": "Título impactante",
      "description": "Sinopse motivadora de 2 parágrafos",
      "categoryName": "Nome da Categoria",
      "tags": ["tag1", "tag2"],
      "modules": [
        {
          "title": "Título do Módulo",
          "lessons": [
            {
              "title": "Título da Aula",
              "content": "Conteúdo detalhado da aula em Markdown..."
            }
          ],
          "exercises": [
            {
              "question": "Pergunta?",
              "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
              "correctAnswer": "Opção A"
            }
          ]
        }
      ],
      "finalExam": [
        {
          "question": "Pergunta Final?",
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
      temperature: 0.6,
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0].message.content;
    const rawData = JSON.parse(content);

    // --- PÓS-PROCESSAMENTO DE MÉTRICAS (Ajustado para Lessons) ---

    let totalWordCount = 0;
    let totalLessons = 0;

    rawData.modules.forEach(mod => {
      mod.lessons.forEach(lesson => {
        totalWordCount += (lesson.content || "").split(/\s+/).length;
        totalLessons++;
      });
    });

    // Velocidade de leitura: 200 ppm + 3 min por exercício/questão
    const readingTime = Math.ceil(totalWordCount / 200);
    const totalQuestions = (rawData.modules.length * exercisesPerModule) + 5;
    const exerciseTime = totalQuestions * 3; 

    const finalEstimatedTime = readingTime + exerciseTime;

    // Gamificação: Baseada no tempo e na complexidade das aulas
    const levelBonus = level === 'avancado' ? 1000 : (level === 'intermediario' ? 750 : 500);
    const finalXpReward = (finalEstimatedTime * 10) + (totalLessons * 20) + levelBonus;

    return {
      ...rawData,
      estimatedTime: finalEstimatedTime,
      xpReward: finalXpReward,
      aiMetadata: {
        provider: 'Groq',
        model: provider,
        totalTokens: chatCompletion.usage?.total_tokens || 0,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error("❌ Erro na Geração da IA (Groq):", error.message);
    throw new Error("A IA falhou em estruturar o curso. Verifique sua conexão ou cota da Groq.");
  }
};

module.exports = { generateCourseContent };