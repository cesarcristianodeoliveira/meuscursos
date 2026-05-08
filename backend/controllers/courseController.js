const client = require('../config/sanity');
const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const quotaService = require('../services/quotaService');
const { formatSlug } = require('../utils/formatter');
const crypto = require('crypto');

/**
 * CRIAR NOVO CURSO COM IA
 */
const createCourse = async (req, res) => {
  const { topic, level } = req.body;
  const userId = req.userId;

  if (!topic) return res.status(400).json({ error: "O tema é obrigatório." });

  try {
    // 1. Verificação de Cota
    const userQuota = await quotaService.checkUserQuota(userId, level);
    if (!userQuota.canGenerate) return res.status(429).json({ error: userQuota.reason });

    // 2. Geração de Conteúdo pela IA
    const aiResponse = await aiService.generateCourseContent(topic, 'llama-3.3-70b-versatile', { level });
    const { course: aiData, usage } = aiResponse;

    // --- MELHORIA: CÁLCULO REAL DE TEMPO ESTIMADO ---
    // Em vez de confiar no valor total da IA, somamos as durações individuais de cada aula
    const calculatedTotalTime = aiData.modules.reduce((acc, mod) => {
      return acc + mod.lessons.reduce((lAcc, lesson) => lAcc + (parseInt(lesson.duration) || 0), 0);
    }, 0);

    // --- MELHORIA: REFINAMENTO DO PROMPT DE IMAGEM ---
    // Se a IA mandar algo genérico, nós enriquecemos com contexto técnico
    const refinedImagePrompt = `${aiData.title} ${aiData.categoryName}, ${aiData.tags?.join(', ')}, professional digital art, high quality educational cover`;

    const imageData = await imageService.fetchAndUploadImage({
        imageSearchPrompt: aiData.imageSearchPrompt || refinedImagePrompt,
        categoryName: aiData.categoryName,
        tags: aiData.tags,
        title: aiData.title
    });

    // 3. Tratamento da Categoria
    const categoryName = aiData.categoryName || 'Geral';
    const categorySlug = formatSlug(categoryName);
    let category = await client.fetch(`*[_type == "category" && slug.current == $slug][0]`, { slug: categorySlug });

    if (!category) {
      category = await client.create({
        _type: 'category',
        title: categoryName,
        slug: { _type: 'slug', current: categorySlug }
      });
    }

    // 4. Construção do Objeto
    const finalSlug = `${formatSlug(aiData.title)}-${crypto.randomBytes(3).toString('hex')}`;
    const thumbnailObj = imageData?.assetId ? {
      _type: 'image',
      asset: { _type: 'reference', _ref: imageData.assetId }
    } : undefined;

    const newCourse = {
      _type: 'course',
      title: aiData.title,
      slug: { _type: 'slug', current: finalSlug },
      description: aiData.description,
      author: { _type: 'reference', _ref: userId },
      category: { _type: 'reference', _ref: category._id },
      level: level || 'iniciante',
      estimatedTime: calculatedTotalTime || aiData.estimatedTime, // Prioriza o calculado
      xpReward: aiData.xpReward || 100,
      tags: aiData.tags || [],
      isPublished: true,
      thumbnail: thumbnailObj,
      externalImageId: imageData?.externalId || "",
      imageSearchPrompt: aiData.imageSearchPrompt,
      modules: aiData.modules.map(m => ({
        _key: crypto.randomUUID(),
        title: m.title,
        lessons: m.lessons.map(l => ({
          _key: crypto.randomUUID(),
          title: l.title,
          content: l.content,
          duration: parseInt(l.duration) || 10
        })),
        exercises: m.exercises.map(e => ({
          _key: crypto.randomUUID(),
          question: e.question,
          options: e.options,
          correctAnswer: e.correctAnswer
        }))
      })),
      finalExam: aiData.finalExam.map(q => ({
        _key: crypto.randomUUID(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer
      })),
      aiMetadata: { 
        provider: 'Groq',
        model: 'llama-3.3-70b-versatile',
        totalTokens: usage?.totalTokens || 0,
        generatedAt: new Date().toISOString() 
      }
    };

    const result = await client.create(newCourse);
    
    await quotaService.consumeCredit(userId);
    const updatedUser = await client.fetch(`*[_type == "user" && _id == $userId][0]{credits, xp}`, { userId });

    return res.status(201).json({ 
      success: true, 
      courseId: result._id, 
      slug: result.slug.current,
      updatedCredits: updatedUser.credits,
      updatedXp: updatedUser.xp
    });

  } catch (error) {
    console.error("❌ Erro fatal na criação do curso:", error);
    try { await quotaService.refundCredit(userId); } catch (e) { console.error("Erro no estorno:", e); }
    return res.status(500).json({ error: "Falha na geração do curso pela IA." });
  }
};

/**
 * SALVAR RESULTADO DO QUIZ E FINALIZAR CURSO
 */
const saveQuizProgress = async (req, res) => {
  const { id: courseId } = req.params;
  const { score, totalQuestions, isFinalExam, moduleKey, moduleTitle, isPassed } = req.body;
  const userId = req.userId;

  try {
    const data = await client.fetch(`{
      "enrollment": *[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0],
      "course": *[_type == "course" && _id == $courseId][0]{xpReward, title},
      "user": *[_type == "user" && _id == $userId][0]{name, xp}
    }`, { userId, courseId });

    let { enrollment, course } = data;
    const scorePercentage = Math.round((score / totalQuestions) * 100);

    if (!enrollment) {
      enrollment = await client.create({
        _type: 'enrollment',
        user: { _type: 'reference', _ref: userId },
        course: { _type: 'reference', _ref: courseId },
        status: 'em_andamento',
        startDate: new Date().toISOString()
      });
    }

    if (isFinalExam) {
      const alreadyCompleted = enrollment.status === 'concluido';
      const passedNow = scorePercentage >= 80;
      
      const patchData = { 
        finalScore: scorePercentage,
        ...(passedNow ? { 
            status: 'concluido', 
            completionDate: enrollment.completionDate || new Date().toISOString(),
            progress: 100 
        } : {})
      };

      await client.patch(enrollment._id).set(patchData).commit();

      // Gerar certificado apenas na primeira conclusão
      if (passedNow && !alreadyCompleted) {
        await client.create({
          _type: 'certificate',
          user: { _type: 'reference', _ref: userId },
          course: { _type: 'reference', _ref: courseId },
          issueDate: new Date().toISOString(),
          hash: crypto.randomBytes(8).toString('hex').toUpperCase(),
          userName: data.user.name,
          courseTitle: course.title
        });

        await quotaService.addXpReward(userId, course.xpReward || 100);
      }
    } else {
      const quizzes = enrollment.completedQuizzes || [];
      const newQuizResult = {
        _key: crypto.randomUUID(),
        moduleKey, moduleTitle, score, totalQuestions,
        percent: scorePercentage,
        isPassed: isPassed 
      };

      const existingIdx = quizzes.findIndex(q => q.moduleKey === moduleKey);
      let updatedQuizzes = [...quizzes];
      if (existingIdx > -1) updatedQuizzes[existingIdx] = newQuizResult;
      else updatedQuizzes.push(newQuizResult);

      await client.patch(enrollment._id).set({ completedQuizzes: updatedQuizzes }).commit();
    }

    return res.status(200).json({ 
      success: true, 
      percent: scorePercentage, 
      status: scorePercentage >= 80 ? 'concluido' : 'tentar_novamente' 
    });
  } catch (error) {
    console.error("❌ Erro no quiz/conclusão:", error);
    return res.status(500).json({ error: "Erro ao processar resultado." });
  }
};

// ... (Outras funções getProgress, saveProgress permanecem similares)

module.exports = { 
  createCourse, saveProgress, saveQuizProgress, 
  getProgress, getUserCourses, getCourseBySlug 
};