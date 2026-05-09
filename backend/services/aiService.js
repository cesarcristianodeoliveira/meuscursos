const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Calcula o tempo estimado de leitura (baseado em ~200 palavras por minuto)
 * + tempo para processar quizzes (1 min por questão).
 */
const calculateRealDuration = (courseData) => {
  let totalWords = 0;
  let totalQuestions = 0;

  courseData.modules.forEach(mod => {
    // Conta palavras das lições
    mod.lessons.forEach(lesson => {
      totalWords += lesson.content.split(/\s+/).length;
    });
    // Conta questões dos quizzes de módulos
    totalQuestions += mod.exercises.length;
  });

  // Conta questões do exame final
  totalQuestions += courseData.finalExam.length;

  const readingTime = Math.ceil(totalWords / 200); 
  const quizTime = totalQuestions * 1.5; // 1min 30s por questão

  return Math.ceil(readingTime + quizTime);
};

const generateCourseContent = async (topic, model, options = {}) => {
  const { level = 'iniciante' } = options;

  const systemPrompt = `
    Você é um Engenheiro de Aprendizagem de última geração e Curador Visual.
    Sua missão é estruturar um curso de alto valor educacional, denso em conteúdo e visualmente mapeável.

    DIRETRIZES DE CONTEÚDO:
    1. LINGUAGEM: Didática, profissional e envolvente.
    2. CONTEÚDO: Cada lição deve ser profunda (mínimo de 300 palavras por lição). Use Markdown para formatação (negrito, listas, blocos de código).
    3. CATEGORIA: Atribua uma categoria lógica (ex: "Desenvolvimento Pessoal", "Data Science", "Culinária").

    DIRETRIZES VISUAIS (PIXABAY OPTIMIZATION):
    - imageSearchPrompt: Gere apenas de 3 a 5 palavras-chave em INGLÊS separadas por ESPAÇOS. 
    - Não use vírgulas, pontos ou frases.
    - Exemplo para Python: "code programming technology screen"
    - Exemplo para Yoga: "meditation yoga nature zen"

    FORMATO JSON OBRIGATÓRIO:
    {
      "title": "Título do Curso",
      "categoryName": "Categoria",
      "description": "Sinopse foca no 'porquê' aprender isso",
      "imageSearchPrompt": "keywords spaces english",
      "xpReward": 0, (Defina entre 500 e 2000 baseado na densidade)
      "tags": ["Tag1", "Tag2"],
      "modules": [
        {
          "title": "Título do Módulo",
          "lessons": [
            { "title": "Título da Aula", "content": "Texto longo em Markdown..." }
          ],
          "exercises": [
            { "question": "Pergunta", "options": ["A", "B", "C", "D"], "correctAnswer": 0 }
          ]
        }
      ],
      "finalExam": [
        { "question": "Pergunta Final", "options": ["A", "B", "C", "D"], "correctAnswer": 0 }
      ]
    }
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Gere um curso magistral sobre: ${topic}. Nível: ${level}.` }
      ],
      model: model || "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const aiData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- LÓGICA DE DURAÇÃO BASEADA EM DADOS REAIS ---
    aiData.estimatedTime = calculateRealDuration(aiData);

    return {
      course: aiData,
      usage: chatCompletion.usage
    };
  } catch (error) {
    console.error("❌ Erro fatal no AI Service:", error);
    throw new Error("Falha na geração inteligente.");
  }
};

module.exports = { generateCourseContent };