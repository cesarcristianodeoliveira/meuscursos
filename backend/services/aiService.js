const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const { v4: uuidv4 } = require('uuid');

/**
 * MOTOR DE INTELIGÊNCIA PEDAGÓGICA (AI Service) v2.0.0
 * Foco: Learning Experience Design (LXD), Polimatia e Automação de Estrutura.
 */

const generateCourseContent = async (topic, provider = 'llama-3.3-70b-versatile', options = {}) => {
  const { level = 'iniciante' } = options;

  // Estratégia baseada na Taxonomia de Bloom para progressão de conhecimento
  const strategy = {
    iniciante: "Foco em recordar e compreender. Use analogias, conceitos fundamentais e remova barreiras técnicas iniciais.",
    intermediario: "Foco em aplicar e analisar. Apresente cenários práticos, resolução de problemas e métodos de trabalho.",
    avancado: "Foco em avaliar e criar. Aborde otimização profunda, arquitetura de soluções e pensamento crítico especializado."
  }[level];

  const systemPrompt = `Você é um Arquiteto Polimata e Especialista em Learning Experience Design (LXD).
Sua missão é decodificar qualquer tema solicitado e transformá-lo em uma jornada de conhecimento estruturada, profunda e pedagogicamente fluida.

DIRETRIZES DE OURO:
1. DESIGN INSTRUCIONAL: Utilize a Técnica de Feynman para simplificar o complexo e garanta que cada aula construa a base para a próxima.
2. ESTÉTICA VERBAL: Utilize um Português (Brasil) elegante e preciso. Sua autoridade vem da perfeição gramatical e clareza conceitual.
3. CURADORIA VISUAL: O campo 'imageSearchPrompt' deve ser um comando visual artístico para um fotógrafo, em INGLÊS (ex: "Macro photography of [subject], cinematic lighting, 8k, professional composition").
4. INTEGRIDADE TÉCNICA: 'correctAnswer' deve ser sempre uma STRING representando o índice da opção (ex: "0", "1").

Retorne APENAS o objeto JSON puro.`;

  const userPrompt = `Crie uma experiência de aprendizado profunda sobre: "${topic}".
Nível Alvo: ${level}.
Estratégia Pedagógica: ${strategy}

ESTRUTURA JSON EXIGIDA:
{
  "title": "Título Impactante",
  "description": "Descrição que demonstre o valor real do curso",
  "categoryName": "Categoria Principal",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "imageSearchPrompt": "Artistic English prompt for cover image",
  "modules": [
    {
      "title": "Nome do Módulo",
      "lessons": [{ "title": "Título da Aula", "content": "Conteúdo rico em Markdown", "duration": 15 }],
      "exercises": [{ "question": "Pergunta desafiadora", "options": ["A","B","C","D"], "correctAnswer": "0" }]
    }
  ],
  "finalExam": [{ "question": "Questão de Certificação", "options": ["A","B","C","D"], "correctAnswer": "0" }]
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: provider,
      temperature: 0.65, // Equilíbrio ideal entre rigor de formato e criatividade pedagógica
      response_format: { type: "json_object" }
    });

    const rawData = JSON.parse(chatCompletion.choices[0].message.content);

    // --- PÓS-PROCESSAMENTO PARA PADRONIZAÇÃO E SANITY ---
    let totalMinutes = 0;

    const formattedModules = (rawData.modules || []).map(mod => {
      const lessons = (mod.lessons || []).map(lesson => {
        // Cálculo de duração real baseado no volume de conteúdo (150 palavras/min)
        const wordCount = (lesson.content || "").split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 150);
        const duration = Math.max(lesson.duration || 5, readingTime);
        totalMinutes += duration;

        return {
          _key: uuidv4(),
          _type: 'lesson',
          title: lesson.title,
          content: lesson.content,
          duration: duration
        };
      });

      const exercises = (mod.exercises || []).map(ex => ({
        _key: uuidv4(),
        _type: 'exercise',
        question: ex.question,
        options: ex.options,
        correctAnswer: String(ex.correctAnswer) // Garante o tipo String exigido pelo Sanity
      }));

      return {
        _key: uuidv4(),
        _type: 'courseModule',
        title: mod.title,
        lessons,
        exercises
      };
    });

    const finalExam = (rawData.finalExam || []).map(q => ({
      _key: uuidv4(),
      _type: 'examQuestion',
      question: q.question,
      options: q.options,
      correctAnswer: String(q.correctAnswer) // Garante o tipo String exigido pelo Sanity
    }));

    // Gamificação: 2 min por questão + Duração das aulas
    const totalQuestions = formattedModules.length + finalExam.length;
    const finalEstimatedTime = totalMinutes + (totalQuestions * 2);
    const levelBonus = { iniciante: 1, intermediario: 1.5, avancado: 2 };

    return {
      course: {
        _type: 'course',
        title: rawData.title,
        description: rawData.description,
        categoryName: rawData.categoryName,
        tags: rawData.tags || [],
        imageSearchPrompt: rawData.imageSearchPrompt || topic,
        level: level,
        estimatedTime: finalEstimatedTime,
        xpReward: Math.round(finalEstimatedTime * 10 * (levelBonus[level] || 1)),
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
    throw new Error("O motor de IA não conseguiu estruturar este conhecimento no momento.");
  }
};

module.exports = { generateCourseContent };