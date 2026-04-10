const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * SERVIÇO DE INTELIGÊNCIA ARTIFICIAL (AI Service)
 * Utiliza o modelo Llama 3.3 via Groq para estruturar cursos completos.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  // Configuração Dinâmica baseada no nível
  const isBeginner = level === 'iniciante';
  const moduleCount = isBeginner ? 3 : 5;
  const exercisesPerModule = isBeginner ? 1 : 2;

  const systemPrompt = `Você é um Professor Expert em Educação Online e Design Instrucional.
    Sua tarefa é estruturar um curso pedagógico, rico em detalhes e pronto para publicação.
    Você deve responder estritamente com um objeto JSON válido.
    
    REGRAS DE CONTEÚDO:
    - O campo "content" de cada módulo deve ser longo (mínimo 500 palavras), didático e formatado em Markdown rico (use ## para subtítulos, listas, tabelas e blocos de código).
    - As "correctAnswer" devem ser a string exata de uma das opções.
    - Gere exatamente ${moduleCount} módulos.
    - Cada módulo deve ter ${exercisesPerModule} exercício(s).
    - O exame final deve ter 5 questões de nível avançado.`;

  const userPrompt = `Crie um curso completo sobre: "${topic}". 
    O nível do curso é: ${level}.
    
    Estrutura do JSON:
    {
      "title": "Título impactante",
      "description": "Sinopse motivadora de 2 parágrafos",
      "categoryName": "Nome da Categoria (ex: Tecnologia, Negócios)",
      "tags": ["tag1", "tag2"],
      "modules": [
        {
          "title": "Título do Módulo",
          "content": "Conteúdo em Markdown...",
          "exercises": [
            {
              "question": "Pergunta?",
              "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
              "correctAnswer": "Opção 1"
            }
          ]
        }
      ],
      "finalExam": [
        {
          "question": "Pergunta Final?",
          "options": ["O1", "O2", "O3", "O4"],
          "correctAnswer": "O1"
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
      temperature: 0.6, // Reduzido levemente para maior consistência no JSON
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0].message.content;
    const rawData = JSON.parse(content);

    // --- PÓS-PROCESSAMENTO DE MÉTRICAS ---
    
    let totalWordCount = 0;
    rawData.modules.forEach(mod => {
      // Conta palavras reais no conteúdo gerado
      totalWordCount += (mod.content || "").split(/\s+/).length;
    });

    // Velocidade de leitura: 200 ppm + 3 min por exercício/questão
    const readingTime = Math.ceil(totalWordCount / 200);
    const totalQuestions = (rawData.modules.length * exercisesPerModule) + 5; // Módulos + Final
    const exerciseTime = totalQuestions * 3; 
    
    const finalEstimatedTime = readingTime + exerciseTime;

    // Gamificação: 10 XP por minuto de curso + bônus de nível
    const levelBonus = level === 'avancado' ? 1000 : (level === 'intermediario' ? 750 : 500);
    const finalXpReward = (finalEstimatedTime * 10) + levelBonus;

    // Retorno estruturado para o Controller
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