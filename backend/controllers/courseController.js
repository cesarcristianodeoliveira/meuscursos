const client = require('../config/sanity');
const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const quotaService = require('../services/quotaService');
const { formatSlug } = require('../utils/formatter');
const crypto = require('crypto');

/**
 * CRIAÇÃO DE CURSO
 */
const createCourse = async (req, res) => {
  const { topic, level } = req.body;
  const userId = req.userId; 

  if (!topic) {
    return res.status(400).json({ error: "O tema do curso é obrigatório." });
  }

  try {
    const userQuota = await quotaService.checkUserQuota(userId);
    if (!userQuota.canGenerate) {
      return res.status(429).json({ error: userQuota.reason });
    }

    const globalQuota = await quotaService.checkGlobalQuota();
    if (!globalQuota.isOk) {
      return res.status(503).json({ error: "Servidor de IA sobrecarregado." });
    }

    const aiData = await aiService.generateCourseContent(topic, 'llama-3.3-70b-versatile', { level });
    const imageData = await imageService.fetchAndUploadImage(aiData);

    const categoryName = aiData.categoryName || 'Geral';
    const categorySlug = formatSlug(categoryName);

    let category = await client.fetch(
      `*[_type == "category" && slug.current == $slug][0]`, 
      { slug: categorySlug }
    );

    if (!category) {
      category = await client.create({
        _type: 'category',
        title: categoryName,
        slug: { _type: 'slug', current: categorySlug }
      });
    }

    const courseTitle = aiData.title;
    const finalSlug = `${formatSlug(courseTitle)}-${crypto.randomBytes(3).toString('hex')}`;

    const newCourse = {
      _type: 'course',
      title: courseTitle,
      slug: { _type: 'slug', current: finalSlug },
      description: aiData.description,
      author: { _type: 'reference', _ref: userId },
      category: { _type: 'reference', _ref: category._id },
      level: level || 'iniciante',
      estimatedTime: aiData.estimatedTime || 0,
      xpReward: aiData.xpReward || 100,
      tags: aiData.tags || [],
      isPublished: true,

      modules: aiData.modules.map(module => ({
        _key: crypto.randomUUID(),
        _type: 'courseModule',
        title: module.title,
        lessons: module.lessons.map(lesson => ({
          _key: crypto.randomUUID(),
          _type: 'lesson',
          title: lesson.title,
          content: lesson.content,
          duration: lesson.duration || 5
        })),
        exercises: module.exercises.map(ex => ({
          _key: crypto.randomUUID(),
          _type: 'exercise',
          question: ex.question,
          options: ex.options,
          correctAnswer: ex.correctAnswer
        }))
      })),

      finalExam: aiData.finalExam.map(ex => ({
        _key: crypto.randomUUID(),
        _type: 'examQuestion',
        question: ex.question,
        options: ex.options,
        correctAnswer: ex.correctAnswer
      })),

      thumbnail: imageData?.assetId ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageData.assetId }
      } : undefined,

      aiMetadata: {
        _type: 'object',
        provider: aiData.aiMetadata?.provider || 'Groq',
        model: aiData.aiMetadata?.model || 'llama-3.3-70b-versatile',
        totalTokens: aiData.aiMetadata?.totalTokens || 0,
        generatedAt: new Date().toISOString()
      }
    };

    const result = await client.create(newCourse);
    await quotaService.consumeCredit(userId);

    return res.status(201).json({
      success: true,
      course: {
        _id: result._id,
        slug: result.slug.current,
        title: result.title
      }
    });

  } catch (error) {
    console.error("❌ Erro no CourseController:", error.message);
    return res.status(500).json({ success: false, error: "Falha na geração." });
  }
};

/**
 * SALVAR PROGRESSO
 */
const saveProgress = async (req, res) => {
  const { id: courseId } = req.params;
  const { lessonId, completed } = req.body;
  const userId = req.userId;

  try {
    const enrollmentQuery = `*[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0]`;
    let enrollment = await client.fetch(enrollmentQuery, { userId, courseId });

    if (!enrollment) {
      enrollment = await client.create({
        _type: 'enrollment',
        user: { _type: 'reference', _ref: userId },
        course: { _type: 'reference', _ref: courseId },
        completedLessons: completed ? [lessonId] : [],
        status: 'em_andamento',
        startDate: new Date().toISOString()
      });
    } else {
      const lessons = enrollment.completedLessons || [];
      const updatedLessons = completed
        ? Array.from(new Set([...lessons, lessonId]))
        : lessons.filter(id => id !== lessonId);

      await client
        .patch(enrollment._id)
        .set({ completedLessons: updatedLessons })
        .commit();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar progresso:", error);
    return res.status(500).json({ error: "Erro interno ao salvar progresso." });
  }
};

/**
 * BUSCAR PROGRESSO
 */
const getProgress = async (req, res) => {
  const { id: courseId } = req.params;
  const userId = req.userId;

  try {
    const enrollment = await client.fetch(
      `*[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0]`,
      { userId, courseId }
    );

    return res.status(200).json({
      success: true,
      completedLessons: enrollment ? enrollment.completedLessons : []
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar progresso." });
  }
};

/**
 * BUSCAR CURSOS DO USUÁRIO
 */
const getUserCourses = async (req, res) => {
  const userId = req.userId;
  try {
    const query = `*[_type == "course" && author._ref == $userId] | order(_createdAt desc)`;
    const courses = await client.fetch(query, { userId });
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar seus cursos." });
  }
};

/**
 * BUSCAR CURSO POR ID (Detalhes)
 */
const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await client.fetch(`*[_type == "course" && _id == $id][0]`, { id });
    if (!course) return res.status(404).json({ error: "Curso não encontrado." });
    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar detalhes do curso." });
  }
};

module.exports = { 
  createCourse, 
  saveProgress, 
  getProgress, 
  getUserCourses,
  getCourseById 
};