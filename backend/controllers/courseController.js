const client = require('../config/sanity');
const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const quotaService = require('../services/quotaService');
const { formatSlug } = require('../utils/formatter');
const crypto = require('crypto');

/**
 * BUSCAR PROGRESSO
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
    console.error("Erro ao buscar progresso:", error);
    return res.status(500).json({ error: "Erro ao buscar progresso." });
  }
};

/**
 * SALVAR PROGRESSO DAS AULAS
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
        .set({ 
          completedLessons: lessons,
          progress: progressPercent 
        })
        .commit();
    }

    return res.status(200).json({ success: true, progress: progressPercent });
  } catch (error) {
    console.error("Erro ao salvar progresso:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};

/**
 * SALVAR RESULTADO DO QUIZ E RECOMPENSAS (FIX: XP & CERTIFICADO)
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
        status: 'em_andamento',
        startDate: new Date().toISOString()
      });
    }

    if (isFinalExam) {
      const isFinishing = scorePercentage >= 80 && enrollment.status !== 'concluido';
      
      const patchData = { 
        finalScore: scorePercentage,
        ...(scorePercentage >= 80 ? { 
            status: 'concluido', 
            completionDate: new Date().toISOString(),
            progress: 100 
        } : {})
      };

      await client.patch(enrollment._id).set(patchData).commit();

      if (isFinishing) {
        // 1. Gerar Certificado
        await client.create({
          _type: 'certificate',
          user: { _type: 'reference', _ref: userId },
          course: { _type: 'reference', _ref: courseId },
          issueDate: new Date().toISOString(),
          hash: crypto.randomBytes(8).toString('hex').toUpperCase(),
          canvasData: JSON.stringify({ courseTitle: course.title, finalScore: scorePercentage })
        });

        // 2. CORREÇÃO CRITICAL: setIfMissing garante que o incremento não falhe
        const reward = course.xpReward || 100;
        await client.patch(userId)
          .setIfMissing({ xp: 0, coursesCompleted: 0 }) // Inicializa se não existir
          .inc({ xp: reward, coursesCompleted: 1 })    // Incrementa ambos
          .commit();
        
        console.log(`✅ Recompensas v1.0.2: ${reward} XP e Certificado gerado.`);
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

    return res.status(200).json({ success: true, percent: scorePercentage, status: scorePercentage >= 80 ? 'concluido' : 'tentar_novamente' });
  } catch (error) {
    console.error("Erro no quiz/conclusão:", error);
    return res.status(500).json({ error: "Erro ao processar resultado." });
  }
};

/**
 * CRIAR CURSO COM IA (REVISADO v1.0.2)
 */
const createCourse = async (req, res) => {
  const { topic, level } = req.body;
  const userId = req.userId;

  const PROVIDER_NAME = 'Groq';
  const MODEL_NAME = 'llama-3.3-70b-versatile';

  if (!topic) return res.status(400).json({ error: "O tema é obrigatório." });

  try {
    const user = await client.fetch(`*[_type == "user" && _id == $userId][0]`, { userId });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const userQuota = await quotaService.checkUserQuota(userId, level);
    if (!userQuota.canGenerate) return res.status(429).json({ error: userQuota.reason });

    const { course: aiData, usage } = await aiService.generateCourseContent(topic, MODEL_NAME, { level });
    
    // CORREÇÃO: Usar Tags e Categoria para buscar a imagem (mais fiel)
    const imageData = await imageService.fetchAndUploadImage({
        categoryName: aiData.categoryName,
        tags: aiData.tags,
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

    // CORREÇÃO: Calcular tempo real somando a duração das aulas
    const realDuration = aiData.modules.reduce((acc, mod) => {
        return acc + mod.lessons.reduce((lAcc, lesson) => lAcc + (lesson.duration || 0), 0);
    }, 0);

    const finalSlug = `${formatSlug(aiData.title)}-${crypto.randomBytes(3).toString('hex')}`;

    const newCourse = {
      _type: 'course',
      title: aiData.title,
      slug: { _type: 'slug', current: finalSlug },
      description: aiData.description,
      author: { _type: 'reference', _ref: userId },
      category: { _type: 'reference', _ref: category._id },
      level: level || 'iniciante',
      estimatedTime: realDuration || aiData.estimatedTime, // Usa a soma real
      xpReward: aiData.xpReward,
      tags: aiData.tags || [],
      isPublished: true,

      thumbnail: imageData?.assetId ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageData.assetId }
      } : undefined,
      externalImageId: imageData?.externalId || "",
      imageSearchPrompt: imageData?.searchPrompt || "",

      modules: aiData.modules.map(m => ({
        _key: crypto.randomUUID(),
        title: m.title,
        lessons: m.lessons.map(l => ({
          _key: crypto.randomUUID(),
          title: l.title,
          content: l.content,
          duration: l.duration
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
        provider: PROVIDER_NAME,
        model: MODEL_NAME,
        totalTokens: usage?.totalTokens || 0,
        generatedAt: new Date().toISOString() 
      }
    };

    const result = await client.create(newCourse);
    await quotaService.consumeCredit(userId);

    return res.status(201).json({ success: true, courseId: result._id, slug: result.slug.current });

  } catch (error) {
    console.error("❌ Erro ao criar curso:", error);
    try { await quotaService.refundCredit(userId); } catch (e) { console.error("Erro no reembolso:", e); }
    return res.status(500).json({ error: "Falha na geração do curso pela IA." });
  }
};

const getCourseBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const course = await client.fetch(
      `*[_type == "course" && slug.current == $slug][0]{
        ...,
        category->{title},
        author->{name, avatar}
      }`, { slug }
    );
    if (!course) return res.status(404).json({ error: "Não encontrado." });
    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno." });
  }
};

const getUserCourses = async (req, res) => {
  try {
    const courses = await client.fetch(
      `*[_type == "course" && author._ref == $userId] | order(_createdAt desc)`,
      { userId: req.userId }
    );
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar seus cursos." });
  }
};

module.exports = { 
  createCourse, saveProgress, saveQuizProgress, 
  getProgress, getUserCourses, getCourseBySlug 
};