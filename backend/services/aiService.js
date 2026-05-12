const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const { v4: uuidv4 } = require('uuid');

/**
 * MOTOR DE APRENDIZADO AUTÔNOMO (AI Service) v3.0.0
 * Foco: Inteligência agnóstica para cursos não regulamentados.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  const systemPrompt = `Você é um Arquiteto de Experiências de Aprendizagem (LXD).
Sua missão é projetar um curso completo sobre o tema solicitado.

DIRETRIZES DE INTELIGÊNCIA:
1. ADAPTABILIDADE: Avalie a complexidade do tema e defina a densidade do conteúdo, o número de módulos e a duração de cada aula de forma orgânica. Não há limite de palavras, busque a maestria sobre o assunto.
2. REPRESENTAÇÃO VISUAL: No campo 'imageSearchPrompt', crie um termo de busca em inglês que represente a atmosfera e o conceito do curso. Seja específico e artístico para garantir imagens de alta qualidade em bancos de imagem.
3. DIDÁTICA: Utilize métodos pedagógicos modernos (como Microlearning ou Storytelling) conforme o que melhor se adaptar ao tema.
4. FORMATO: Retorne estritamente um JSON. 'correctAnswer' deve ser sempre uma string com o índice da opção (ex: "0").`;

  const userPrompt = `Desenvolva um curso de nível ${level} sobre: "${topic}".
O curso deve conter uma estrutura completa de módulos, lições profundas, exercícios práticos e um exame final de certificação.

ESTRUTURA JSON:
{
  "title": "...",
  "description": "...",
  "categoryName": "...",
  "tags": ["...", "...", "..."],
  "imageSearchPrompt": "...",
  "modules": [
    {
      "title": "...",
      "lessons": [{ "title": "...", "content": "...", "duration": 0 }],
      "exercises": [{ "question": "...", "options": ["...", "..."], "correctAnswer": "0" }]
    }
  ],
  "finalExam": [{ "question": "...", "options": ["...", "..."], "correctAnswer": "0" }]
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: provider,
      temperature: 0.7, 
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- PROCESSAMENTO DINÂMICO (Sem travas de duração ou tamanho) ---
    let totalMinutes = 0;

    const formattedModules = (rawData.modules || []).map(mod => {
      const lessons = (mod.lessons || []).map(lesson => {
        // A duração é respeitada conforme a IA definiu, 
        // ou calculada organicamente se ela omitir.
        const wordCount = (lesson.content || "").split(/\s+/).length;
        const estimatedTime = Math.ceil(wordCount / 180); // Velocidade média de leitura
        const duration = lesson.duration || estimatedTime || 5;
        
        totalMinutes += duration;

        return {
          _key: uuidv4(),
          _type: 'lesson',
          title: lesson.title,
          content: lesson.content,
          duration: duration
        };
      });

      return {
        _key: uuidv4(),
        _type: 'courseModule',
        title: mod.title,
        lessons,
        exercises: (mod.exercises || []).map(ex => ({
          _key: uuidv4(),
          _type: 'exercise',
          question: ex.question,
          options: ex.options,
          correctAnswer: String(ex.correctAnswer)
        }))
      };
    });

    const finalExam = (rawData.finalExam || []).map(q => ({
      _key: uuidv4(),
      _type: 'examQuestion',
      question: q.question,
      options: q.options,
      correctAnswer: String(q.correctAnswer)
    }));

    // XP baseado no esforço total da jornada gerada
    const levelBonus = { iniciante: 1, intermediario: 1.5, avancado: 2 };
    const xpReward = Math.round((totalMinutes * 10 + (finalExam.length * 20)) * (levelBonus[level] || 1));

    return {
      course: {
        _type: 'course',
        title: rawData.title,
        description: rawData.description,
        categoryName: rawData.categoryName,
        tags: rawData.tags || [],
        imageSearchPrompt: rawData.imageSearchPrompt || (rawData.tags ? rawData.tags.join(' ') : topic),
        level: level,
        estimatedTime: totalMinutes + (finalExam.length * 2),
        xpReward: xpReward,
        modules: formattedModules,
        finalExam: finalExam,
        isPublished: true,
        aiMetadata: {
          _type: 'object',
          provider: `Groq (${provider})`,
          totalTokens: chatCompletion.usage?.total_tokens || 0,
          generatedAt: new Date().toISOString()
        }
      }
    };

  } catch (error) {
    console.error("❌ Erro Crítico no aiService:", error);
    throw new Error("Falha ao estruturar a experiência de aprendizado.");
  }
};

module.exports = { generateCourseContent };