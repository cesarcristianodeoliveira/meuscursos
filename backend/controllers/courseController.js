const client = require('../config/sanity');
const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const quotaService = require('../services/quotaService');
const { formatSlug } = require('../utils/formatter');
const crypto = require('crypto');

/**
 * BUSCAR TODOS OS CURSOS (Vitrine/Home)
 * Esta função costuma faltar e causar o erro de "handler must be a function" nas rotas
 */
const getAllCourses = async (req, res) => {
  try {
    const courses = await client.fetch(
      `*[_type == "course" && isPublished == true] | order(_createdAt desc) {
        ...,
        category->{title},
        author->{name, avatar}
      }`
    );
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("❌ Erro ao buscar cursos:", error);
    return res.status(500).json({ error: "Erro ao carregar vitrine de cursos." });
  }
};

/**
 * BUSCAR PROGRESSO DO ALUNO
 */
const getProgress = async (req, res) => {
  const { id: courseId } = req.params;
  const userId = req.userId;

  try {
    const enrollment = await client.fetch(
      `*[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0]{
        _id,
        completedLessons,
        completedQuizzes,
        finalScore,
        status,
        progress
      }`,
      { userId, courseId }
    );

    return res.status(200).json({ 
      success: true, 
      progress: enrollment?.progress || 0,
      completedLessons: enrollment?.completedLessons || [],
      completedQuizzes: enrollment?.completedQuizzes || [],
      finalScore: enrollment?.finalScore || 0,
      status: enrollment?.status || 'nao_iniciado'
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar progresso." });
  }
};

/**
 * SALVAR PROGRESSO DE LEITURA (AULAS)
 */
const saveProgress = async (req, res) => {
  const { id: courseId } = req.params;
  const { lessonId, lessonTitle, completed } = req.body;
  const userId = req.userId;

  try {
    const data = await client.fetch(`{
      "enrollment": *[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0],
      "totalLessons": count(*[_id == $courseId][0].modules[].lessons[])
    }`, { userId, courseId });

    const { enrollment, totalLessons } = data;
    let lessons = enrollment?.completedLessons || [];

    if (completed) {
      if (!lessons.some(l => l.lessonKey === lessonId)) {
        lessons.push({
          _key: crypto.randomUUID(),
          lessonKey: lessonId,
          lessonTitle: lessonTitle,
          completedAt: new Date().toISOString()
        });
      }
    } else {
      lessons = lessons.filter(l => l.lessonKey !== lessonId);
    }

    const progressPercent = Math.min(100, Math.round((lessons.length / (totalLessons || 1)) * 100));

    if (!enrollment) {
      await client.create({
        _type: 'enrollment',
        user: { _type: 'reference', _ref: userId },
        course: { _type: 'reference', _ref: courseId },
        completedLessons: lessons,
        progress: progressPercent,
        status: 'em_andamento',
        startDate: new Date().toISOString()
      });
    } else {
      await client.patch(enrollment._id)
        .set({ completedLessons: lessons, progress: progressPercent })
        .commit();
    }

    return res.status(200).json({ success: true, progress: progressPercent });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao salvar progresso." });
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
      "course": *[_type == "course" && _id == $courseId][0]{xpReward, title}
    }`, { userId, courseId });

    let { enrollment, course } = data;
    const scorePercentage = Math.round((score / totalQuestions) * 100);

    if (!enrollment) {
      enrollment = await client.create({
        _type: 'enrollment',
        user: { _type: 'reference', _ref: userId },
        course: { _type: 'reference', _ref: courseId },
        status: 'em_andamento'
      });
    }

    if (isFinalExam) {
      const alreadyCompleted = enrollment.status === 'concluido';
      const isFinishingNow = scorePercentage >= 80 && !alreadyCompleted;
      
      const patchData = { 
        finalScore: scorePercentage,
        ...(scorePercentage >= 80 ? { status: 'concluido', completionDate: new Date().toISOString(), progress: 100 } : {})
      };

      await client.patch(enrollment._id).set(patchData).commit();

      if (isFinishingNow) {
        await client.create({
          _type: 'certificate',
          user: { _type: 'reference', _ref: userId },
          course: { _type: 'reference', _ref: courseId },
          issueDate: new Date().toISOString(),
          hash: crypto.randomBytes(8).toString('hex').toUpperCase()
        });
        await quotaService.addXpReward(userId, course.xpReward || 100);
      }
    } else {
      const quizzes = enrollment.completedQuizzes || [];
      const newQuizResult = { _key: crypto.randomUUID(), moduleKey, moduleTitle, score, totalQuestions, percent: scorePercentage, isPassed };
      const existingIdx = quizzes.findIndex(q => q.moduleKey === moduleKey);
      let updatedQuizzes = [...quizzes];
      if (existingIdx > -1) updatedQuizzes[existingIdx] = newQuizResult;
      else updatedQuizzes.push(newQuizResult);

      await client.patch(enrollment._id).set({ completedQuizzes: updatedQuizzes }).commit();
    }

    return res.status(200).json({ success: true, percent: scorePercentage });
  } catch (error) {
    return res.status(500).json({ error: "Erro no processamento do quiz." });
  }
};

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

    const { course: aiData, usage } = await aiService.generateCourseContent(topic, 'llama-3.3-70b-versatile', { level });
    
    const imageData = await imageService.fetchAndUploadImage({
        imageSearchPrompt: aiData.imageSearchPrompt,
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

    const newCourse = {
      _type: 'course',
      title: aiData.title,
      slug: { _type: 'slug', current: finalSlug },
      description: aiData.description,
      author: { _type: 'reference', _ref: userId },
      category: { _type: 'reference', _ref: category._id },
      level: level || 'iniciante',
      estimatedTime: aiData.estimatedTime,
      xpReward: aiData.xpReward,
      isPublished: true,
      thumbnail: imageData?.assetId ? { _type: 'image', asset: { _type: 'reference', _ref: imageData.assetId } } : undefined,
      modules: aiData.modules.map(m => ({
        _key: crypto.randomUUID(),
        title: m.title,
        lessons: m.lessons.map(l => ({ _key: crypto.randomUUID(), title: l.title, content: l.content, duration: l.duration })),
        exercises: m.exercises.map(e => ({ _key: crypto.randomUUID(), question: e.question, options: e.options, correctAnswer: e.correctAnswer }))
      })),
      finalExam: aiData.finalExam.map(q => ({ _key: crypto.randomUUID(), question: q.question, options: q.options, correctAnswer: q.correctAnswer }))
    };

    const result = await client.create(newCourse);
    await quotaService.consumeCredit(userId);

    return res.status(201).json({ success: true, slug: result.slug.current });
  } catch (error) {
    return res.status(500).json({ error: "Falha na criação." });
  }
};

const getCourseBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const course = await client.fetch(`*[_type == "course" && slug.current == $slug][0]{..., category->{title}, author->{name}}`, { slug });
    if (!course) return res.status(404).json({ error: "Não encontrado" });
    res.json({ success: true, course });
  } catch (err) { res.status(500).json({ error: "Erro" }); }
};

const getUserCourses = async (req, res) => {
  try {
    const courses = await client.fetch(`*[_type == "course" && author._ref == $userId]`, { userId: req.userId });
    res.json({ success: true, courses });
  } catch (err) { res.status(500).json({ error: "Erro" }); }
};

// EXPORTAÇÃO COMPLETA - Verifique se os nomes batem com seu courseRoutes.js
module.exports = { 
  getAllCourses, // Essencial para a vitrine
  createCourse, 
  saveProgress, 
  saveQuizProgress, 
  getProgress, 
  getUserCourses, 
  getCourseBySlug 
};