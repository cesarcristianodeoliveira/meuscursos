const client = require('../config/sanity');
const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const quotaService = require('../services/quotaService');
const { formatSlug } = require('../utils/formatter');
const crypto = require('crypto');

/**
 * 1. VITRINE GLOBAL
 */
const getAllCourses = async (req, res) => {
  try {
    const courses = await client.fetch(
      `*[_type == "course" && isPublished == true] | order(_createdAt desc) {
        _id, title, "slug": slug.current, description, level, estimatedTime, xpReward,
        "thumbnail": thumbnail.asset->url,
        category->{title},
        author->{name, avatar}
      }`
    );
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao carregar cursos." });
  }
};

/**
 * 2. GERAÇÃO DE CURSO COM IA (Motor LXD de Lançamento)
 */
const createCourse = async (req, res) => {
  const { topic, level } = req.body;
  const userId = req.userId;

  if (!topic) return res.status(400).json({ error: "O tema é obrigatório." });

  try {
    // 1. Validação de Cotas
    const userQuota = await quotaService.checkUserQuota(userId, level);
    if (!userQuota.canGenerate) return res.status(429).json({ error: userQuota.reason });

    // 2. Geração AI (LXD Nativo)
    const { course: aiData } = await aiService.generateCourseContent(topic, 'llama-3.3-70b-versatile', { level });
    
    // 3. Imagem Contextual
    const imageData = await imageService.fetchAndUploadImage({
        imageSearchPrompt: aiData.imageSearchPrompt,
        title: aiData.title
    });

    // 4. Categoria
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

    // 5. Persistência (Atomicidade: O crédito só é gasto se o curso for salvo)
    const newCourse = {
      ...aiData,
      slug: { _type: 'slug', current: `${formatSlug(aiData.title)}-${crypto.randomBytes(3).toString('hex')}` },
      author: { _type: 'reference', _ref: userId },
      category: { _type: 'reference', _ref: category._id },
      thumbnail: imageData?.assetId ? { _type: 'image', asset: { _type: 'reference', _ref: imageData.assetId } } : undefined,
    };

    const result = await client.create(newCourse);
    
    // SÓ CONSOME O CRÉDITO AGORA
    await quotaService.consumeCredit(userId);

    return res.status(201).json({ success: true, slug: result.slug.current });

  } catch (error) {
    console.error("❌ Falha no fluxo de criação:", error);
    return res.status(500).json({ error: "Não foi possível gerar seu curso agora. Tente em instantes." });
  }
};

/**
 * 3. AMBIENTE DE ESTUDO & DETALHES
 */
const getCourseBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const course = await client.fetch(
      `*[_type == "course" && slug.current == $slug][0]{
        ...,
        category->{title},
        author->{name, avatar},
        "thumbnail": thumbnail.asset->url
      }`, { slug }
    );
    if (!course) return res.status(404).json({ error: "Curso não encontrado." });
    return res.json({ success: true, course });
  } catch (err) { 
    return res.status(500).json({ error: "Erro ao carregar dados do curso." }); 
  }
};

/**
 * 4. PROGRESSO E MATRÍCULA
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
      progress: enrollment?.progress || 0,
      completedLessons: enrollment?.completedLessons || [],
      status: enrollment?.status || 'nao_iniciado'
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar progresso." });
  }
};

const saveProgress = async (req, res) => {
  const { id: courseId } = req.params;
  const { lessonId, lessonTitle, completed } = req.body;
  const userId = req.userId;

  try {
    const data = await client.fetch(`{
      "enrollment": *[_type == "enrollment" && user._ref == $userId && course._ref == $courseId][0],
      "totalLessons": count(*[_id == $courseId][0].modules[].lessons[])
    }`, { userId, courseId });

    let { enrollment, totalLessons } = data;
    let lessons = enrollment?.completedLessons || [];

    if (completed) {
      if (!lessons.some(l => l.lessonKey === lessonId)) {
        lessons.push({ 
          _key: crypto.randomUUID(), 
          lessonKey: lessonId, 
          lessonTitle, 
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
        status: 'em_andamento'
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

const saveQuizProgress = async (req, res) => {
    const { id: courseId } = req.params;
    const { score, totalQuestions, isFinalExam } = req.body;
    const userId = req.userId;

    try {
        if (isFinalExam && (score / totalQuestions) >= 0.7) {
            const course = await client.fetch(`*[_id == $courseId][0]{xpReward}`, { courseId });
            // Passamos o courseId para evitar ganho de XP duplicado
            await quotaService.addXpReward(userId, courseId, course.xpReward);
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Erro ao registrar quiz." });
    }
};

const getUserCourses = async (req, res) => {
  try {
    const courses = await client.fetch(
      `*[_type == "course" && author._ref == $userId] | order(_createdAt desc) {
        _id, title, "slug": slug.current, level, xpReward, isPublished,
        "thumbnail": thumbnail.asset->url
      }`, 
      { userId: req.userId }
    );
    res.json({ success: true, courses });
  } catch (err) { 
    res.status(500).json({ error: "Erro ao listar seus cursos." }); 
  }
};

module.exports = { 
  getAllCourses, 
  createCourse, 
  saveProgress, 
  saveQuizProgress, 
  getProgress, 
  getUserCourses, 
  getCourseBySlug 
};