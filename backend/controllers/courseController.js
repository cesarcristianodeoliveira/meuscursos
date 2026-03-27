const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const ADMIN_ID = process.env.ADMIN_ID; // ID padrão para quem não está logado

/**
 * Lógica de Créditos: 
 * Se passou 24h desde o último login/uso, reseta para 3.
 */
const updateAndCheckCredits = async (user) => {
  if (user.role === 'admin') return true;

  const now = new Date();
  const lastUpdate = user.stats?.lastLogin ? new Date(user.stats.lastLogin) : new Date(0);
  const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);

  // Se passou 24h e ele tem menos de 3, resetamos agora
  if (hoursPassed >= 24) {
    if (user.credits < 3) {
      const updatedUser = await client.patch(user._id)
        .set({ credits: 3, "stats.lastLogin": now.toISOString() })
        .commit();
      return updatedUser.credits > 0;
    }
    // Se já tinha 3 ou mais, apenas atualiza o tempo para contar as próximas 24h
    await client.patch(user._id).set({ "stats.lastLogin": now.toISOString() }).commit();
  }

  return user.credits > 0;
};

const generateCourse = async (req, res) => {
  req.setTimeout(600000); 

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

    // 1. Busca o usuário com os dados mais recentes
    const user = await client.fetch(`*[_type == "user" && _id == $targetUserId][0]`, { targetUserId });
    if (!user) throw new Error('Usuário não identificado.');

    // 2. Sincroniza créditos (Refresh de 24h)
    const canGenerate = await updateAndCheckCredits(user);
    if (!canGenerate && user.role !== 'admin') {
      throw new Error('Você não tem créditos suficientes. Renovação em 24h.');
    }

    // --- MANIPULAÇÃO DOS 3 ESTADOS ---
    // Estado A: Admin (Pode tudo, não gasta crédito)
    // Estado B: Pro (Pode tudo, gasta crédito)
    // Estado C: Grátis (Limitado, gasta crédito)
    const isFullAccess = user.role === 'admin' || user.plan === 'pro';

    sendProgress(20, `Preparando conteúdo (${isFullAccess ? 'Premium' : 'Básico'})...`);

    // 3. IA Gera Conteúdo
    // Passamos isFullAccess para o aiService decidir se gera o objeto de exercícios
    const courseData = await generateCourseContent(topic, provider, { fullContent: isFullAccess });

    // 4. Imagem de Capa (Independente de plano ou role, como você pediu)
    sendProgress(50, "Gerando capa do curso...");
    const coverAsset = await fetchAndUploadImage(topic, courseData.category?.name);

    // 5. Processamento dos Módulos baseado no plano
    const processedModules = (courseData.modules || []).map((mod, index) => ({
      _key: `mod_${index}_${Date.now()}`,
      title: mod.title,
      content: mod.content,
      // Se for Grátis, ignoramos exercícios
      exercises: isFullAccess ? (mod.exercises || []).map(ex => ({
        _key: `ex_${Math.random().toString(36).substr(2, 9)}`,
        ...ex,
        correctAnswer: String(ex.correctAnswer)
      })) : []
    }));

    // 6. Montagem do Documento
    const doc = {
      _type: 'course',
      title: courseData.title || topic,
      slug: { _type: 'slug', current: formatSlug(courseData.title || topic) },
      author: { _type: 'reference', _ref: targetUserId },
      description: courseData.description,
      // Grátis sempre 'iniciante', Pro/Admin segue a IA
      level: isFullAccess ? (courseData.level || 'intermediario') : 'iniciante',
      isPublished: true,
      enrolledCount: 0,
      completedCount: 0,
      category: {
        name: courseData.category?.name || "Geral",
        slug: formatSlug(courseData.category?.name || "geral")
      },
      stats: {
        totalTokens: courseData.usage?.totalTokens || 0,
        generatedAt: new Date().toISOString()
      },
      modules: processedModules,
      // Exame final sempre disponível para todos
      finalExam: (courseData.finalExam || []).map(exam => ({
        _key: `exam_${Math.random().toString(36).substr(2, 9)}`,
        ...exam,
        correctAnswer: String(exam.correctAnswer)
      }))
    };

    if (coverAsset?._id) {
      doc.thumbnail = { _type: 'image', asset: { _type: 'reference', _ref: coverAsset._id } };
      doc.externalImageId = coverAsset.externalId;
    }

    sendProgress(90, "Salvando curso...");
    const result = await client.create(doc);

    // 7. Consumo de Crédito (Apenas para não-admins)
    if (user.role !== 'admin') {
      await client.patch(targetUserId)
        .dec({ credits: 1 })
        .inc({ "stats.coursesCreated": 1 })
        .commit();
    }

    sendProgress(100, 'Curso disponível!', { courseId: result._id, slug: doc.slug.current });
    res.end();

  } catch (error) {
    console.error("❌ Erro no Controller:", error.message);
    res.write(`data: ${JSON.stringify({ error: "ERROR", message: error.message })}\n\n`);
    res.end();
  }
};

module.exports = { generateCourse };