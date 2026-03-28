const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const ADMIN_ID = process.env.ADMIN_ID;

const updateAndCheckCredits = async (user) => {
  if (user.role === 'admin') return true;
  const now = new Date();
  const lastUpdate = user.stats?.lastLogin ? new Date(user.stats.lastLogin) : new Date(0);
  const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);

  if (hoursPassed >= 24) {
    // Reset diário de créditos para usuários free
    if (user.credits < 3) {
      await client.patch(user._id).set({ credits: 3, "stats.lastLogin": now.toISOString() }).commit();
      return true;
    }
    await client.patch(user._id).set({ "stats.lastLogin": now.toISOString() }).commit();
  }
  return user.credits > 0;
};

const generateCourse = async (req, res) => {
  req.setTimeout(600000); // 10 minutos para processos longos de IA
  const { topic, provider, userId } = req.body;
  const targetUserId = userId || ADMIN_ID;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = (progress, message, extra = {}) => {
    res.write(`data: ${JSON.stringify({ progress, message, ...extra })}\n\n`);
  };

  try {
    sendProgress(5, "Verificando conta e créditos...");
    const user = await client.fetch(`*[_type == "user" && _id == $targetUserId][0]`, { targetUserId });
    if (!user) throw new Error('Usuário não identificado.');

    const canGenerate = await updateAndCheckCredits(user);
    if (!canGenerate && user.role !== 'admin') {
      throw new Error('Créditos insuficientes.');
    }

    const isFullAccess = user.role === 'admin' || user.plan === 'pro';

    sendProgress(20, `IA gerando conteúdo ${isFullAccess ? 'Premium' : 'Básico'}...`);
    const courseData = await generateCourseContent(topic, provider, { fullContent: isFullAccess });

    sendProgress(60, "Buscando identidade visual única...");
    // Usamos a searchQuery vinda da IA para uma busca mais precisa no Pixabay
    const coverResult = await fetchAndUploadImage(courseData.searchQuery || topic, courseData.category?.name);

    // --- PROCESSAMENTO DE MÓDULOS ---
    const processedModules = (courseData.modules || []).map((mod, index) => ({
      _key: `mod_${index}_${Date.now()}`,
      title: mod.title,
      content: mod.content,
      exercises: isFullAccess ? (mod.exercises || []).map(ex => ({
        _key: `ex_${Math.random().toString(36).substr(2, 9)}`,
        ...ex,
        correctAnswer: String(ex.correctAnswer)
      })) : []
    }));

    // --- MONTAGEM DO DOCUMENTO FINAL ---
    const doc = {
      _type: 'course',
      title: courseData.title || topic,
      slug: { _type: 'slug', current: formatSlug(courseData.title || topic) },
      author: { _type: 'reference', _ref: targetUserId },
      description: courseData.description,
      // Usamos o tempo calculado pela IA (agora em horas realistas)
      estimatedTime: parseInt(courseData.estimatedTime) || 1,
      rating: Number(courseData.rating) || 4.5,
      level: courseData.level || (isFullAccess ? 'intermediario' : 'iniciante'),
      isPublished: true,
      aiProvider: courseData.aiProvider,
      aiModel: courseData.aiModel,
      category: {
        name: courseData.category?.name || "Geral",
        slug: formatSlug(courseData.category?.name || "geral")
      },
      // Usamos as tags limpas vindas do aiService
      tags: courseData.tags || [courseData.category?.name].filter(Boolean),

      stats: {
        promptTokens: courseData.usage?.promptTokens || 0,
        completionTokens: courseData.usage?.completionTokens || 0,
        totalTokens: courseData.usage?.totalTokens || 0,
        generatedAt: new Date().toISOString()
      },
      modules: processedModules,
      finalExam: (courseData.finalExam || []).map(exam => ({
        _key: `exam_${Math.random().toString(36).substr(2, 9)}`,
        ...exam,
        correctAnswer: String(exam.correctAnswer)
      }))
    };

    // Vinculando a imagem e o ID externo (Pixabay) para garantir ineditismo futuro
    if (coverResult?.assetId) {
      doc.thumbnail = {
        _type: 'image',
        asset: { _type: 'reference', _ref: coverResult.assetId }
      };
      doc.externalImageId = coverResult.externalImageId;
    }

    sendProgress(95, "Salvando no Sanity...");
    const result = await client.create(doc);

    // Debitar crédito e atualizar contador de cursos do usuário
    if (user.role !== 'admin') {
      await client.patch(targetUserId)
        .dec({ credits: 1 })
        .inc({ "stats.coursesCreated": 1 })
        .commit();
    }

    sendProgress(100, 'Curso Finalizado!', { courseId: result._id, slug: doc.slug.current });
    res.end();

  } catch (error) {
    console.error("❌ Erro no Controller:", error.message);
    res.write(`data: ${JSON.stringify({ error: "ERROR", message: error.message })}\n\n`);
    res.end();
  }
};

module.exports = { generateCourse };