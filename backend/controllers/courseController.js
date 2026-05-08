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
    const userQuota = await quotaService.checkUserQuota(userId, level);
    if (!userQuota.canGenerate) return res.status(429).json({ error: userQuota.reason });

    const aiResponse = await aiService.generateCourseContent(topic, 'llama-3.3-70b-versatile', { level });
    const { course: aiData, usage } = aiResponse;

    const calculatedTotalTime = aiData.modules.reduce((acc, mod) => {
      return acc + mod.lessons.reduce((lAcc, lesson) => lAcc + (parseInt(lesson.duration) || 0), 0);
    }, 0);

    const refinedImagePrompt = `${aiData.title} ${aiData.categoryName}, professional digital art, high quality educational cover`;

    const imageData = await imageService.fetchAndUploadImage({
        imageSearchPrompt: aiData.imageSearchPrompt || refinedImagePrompt,
        categoryName: aiData.categoryName,
        title: aiData.title
    });

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
      estimatedTime: calculatedTotalTime || aiData.estimatedTime,
      xpReward: aiData.xpReward || 100,
      tags: aiData.tags || [],
      isPublished: true,
      thumbnail: thumbnailObj,
      externalImageId: imageData?.externalId || "",
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
      }))
    };

    const result = await client.create(newCourse);
    await quotaService.consumeCredit(userId);
    const updatedUser = await client.fetch(`*[_type == "user" && _id == $userId][0]{credits, xp}`, { userId });

    return res.status(201).json({ 
      success: true, 
      slug: result.slug.current,
      updatedCredits: updatedUser.credits,
      updatedXp: updatedUser.xp
    });

  } catch (error) {
    console.error("❌ Erro no createCourse:", error);
    return res.status(500).json({ error: "Erro na geração do curso." });
  }
};

/**
 * SALVAR PROGRESSO DE LEITURA (Lições)
 */
const saveProgress = async (req, res) => {
  const { id: courseId } = req.params;
  const { lessonKey, progress } = req.body;
  const userId = req.userId;

  try {
    let enrollment = await client.fetch(
      `*[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0]`,
      { userId, courseId }
    );

    if (!enrollment) {
      enrollment = await client.create({
        _type: 'enrollment',
        user: { _type: 'reference', _ref: userId },
        course: { _type: 'reference', _ref: courseId },
        completedLessons: [lessonKey],
        status: 'em_andamento',
        progress: progress || 0
      });
    } else {
      const completedLessons = enrollment.completedLessons || [];
      if (!completedLessons.includes(lessonKey)) {
        await client.patch(enrollment._id)
          .setIfMissing({ completedLessons: [] })
          .insert('after', 'completedLessons[-1]', [lessonKey])
          .set({ progress: progress })
          .commit();
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao salvar progresso." });
  }
};

/**
 * SALVAR RESULTADO DO QUIZ
 */
const saveQuizProgress = async (req, res) => {
  const { id: courseId } = req.params;
  const { score, totalQuestions, isFinalExam, moduleKey, moduleTitle } = req.body;
  const userId = req.userId;

  try {
    const data = await client.fetch(`{
      "enrollment": *[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0],
      "course": *[_type == "course" && _id == $courseId][0]{xpReward, title},
      "user": *[_type == "user" && _id == $userId][0]{name, xp}
    }`, { userId, courseId });

    const scorePercentage = Math.round((score / totalQuestions) * 100);

    if (isFinalExam && scorePercentage >= 80) {
      await client.patch(data.enrollment._id)
        .set({ status: 'concluido', finalScore: scorePercentage, progress: 100 })
        .commit();
      
      // Lógica de Certificado e XP aqui...
      await quotaService.addXpReward(userId, data.course.xpReward || 100);
    }

    return res.status(200).json({ success: true, percent: scorePercentage });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao processar quiz." });
  }
};

// Funções auxiliares de busca
const getCourseBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const course = await client.fetch(`*[_type == "course" && slug.current == $slug][0]{..., category->{title}}`, { slug });
        if (!course) return res.status(404).json({ error: "Curso não encontrado" });
        res.json(course);
    } catch (err) { res.status(500).json({ error: "Erro ao buscar curso" }); }
};

const getProgress = async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    try {
        const progress = await client.fetch(`*[_type == "enrollment" && user._ref == $userId && course._ref == $id][0]`, { userId, id });
        res.json(progress || { progress: 0, completedLessons: [] });
    } catch (err) { res.status(500).json({ error: "Erro ao buscar progresso" }); }
};

module.exports = { 
  createCourse, 
  saveProgress, 
  saveQuizProgress, 
  getCourseBySlug, 
  getProgress 
};