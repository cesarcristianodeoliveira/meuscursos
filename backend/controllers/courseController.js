const client = require('../config/sanity');
const { formatSlug } = require('../utils/formatter');
const { fetchAndUploadImage } = require('../services/imageService');
const { generateCourseContent } = require('../services/aiService');

const ADMIN_ID = process.env.ADMIN_ID;

/**
 * Lógica de Créditos e Cooldown (1 por hora)
 */
const checkAndConsumeCredits = async (user) => {
  if (user.role === 'admin') return { canGenerate: true };

  const now = new Date();
  const lastGen = user.stats?.lastLogin ? new Date(user.stats.lastLogin) : new Date(0);
  const msPassed = now - lastGen;
  const hoursPassed = msPassed / (1000 * 60 * 60);

  // Se passou mais de 1 hora, resetamos o crédito para 1 (limite free)
  if (hoursPassed >= 1) {
    return { canGenerate: true, resetNeeded: true };
  }

  // Se não passou 1 hora, verifica se ainda tem o crédito
  return { 
    canGenerate: user.credits > 0, 
    resetNeeded: false,
    timeLeft: Math.ceil(60 - (msPassed / (1000 * 60))) // minutos restantes
  };
};

const generateCourse = async (req, res) => {
  req.setTimeout(600000); // 10 minutos de timeout para processos longos
  const { topic, provider, userId } = req.body;
  
  const isGuest = !userId;
  const targetUserId = userId || ADMIN_ID;

  // Setup Server-Sent Events para feedback em tempo real
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = (progress, message, extra = {}) => {
    res.write(`data: ${JSON.stringify({ progress, message, ...extra })}\n\n`);
  };

  try {
    sendProgress(5, "Validando acesso e créditos...");
    const user = await client.fetch(`*[_type == "user" && _id == $targetUserId][0]`, { targetUserId });
    
    if (!user) throw new Error('Usuário não encontrado no sistema.');

    const status = await checkAndConsumeCredits(user);
    
    if (!status.canGenerate) {
      throw new Error(`Limite atingido. Você poderá gerar um novo curso em ${status.timeLeft} minutos.`);
    }

    // Definição de Nível (Iniciante para Free/Guest, Intermediário para Pro/Admin)
    const isFullAccess = !isGuest && (user.role === 'admin' || user.plan === 'pro');
    const forcedLevel = isFullAccess ? 'intermediario' : 'iniciante';

    sendProgress(20, `O Professor IA está estruturando seu curso nível ${forcedLevel}...`);
    
    // 1. GERAÇÃO DO CONTEÚDO (IA)
    const courseData = await generateCourseContent(topic, provider, { level: forcedLevel });

    sendProgress(60, "Buscando identidade visual educativa...");
    
    // 2. GERAÇÃO DA IMAGEM
    const coverResult = await fetchAndUploadImage(courseData.searchQuery || topic, courseData.category?.name);

    // 3. PROCESSAMENTO DOS MÓDULOS (Transformando em blocos Sanity)
    const processedModules = (courseData.modules || []).map((mod, index) => ({
      _key: `mod_${index}_${Date.now()}`,
      title: mod.title,
      content: mod.content,
      exercises: (mod.exercises || []).map((ex, i) => ({
        _key: `ex_${index}_${i}_${Date.now()}`,
        ...ex,
        correctAnswer: String(ex.correctAnswer)
      }))
    }));

    // 4. MONTAGEM DO DOCUMENTO FINAL
    const doc = {
      _type: 'course',
      title: courseData.title || topic,
      slug: { _type: 'slug', current: `${formatSlug(courseData.title || topic)}-${Date.now().toString().slice(-4)}` },
      author: { _type: 'reference', _ref: targetUserId },
      description: courseData.description,
      estimatedTime: courseData.estimatedTime || (processedModules.length * 1.5),
      rating: 0,
      level: forcedLevel,
      isPublished: true,
      aiProvider: courseData.aiProvider,
      aiModel: courseData.aiModel,
      category: {
        name: courseData.category?.name || "Geral",
        slug: formatSlug(courseData.category?.name || "geral")
      },
      tags: courseData.tags || [],
      enrolledStudents: [], // Inicia sem alunos
      completedStudents: [], // Inicia sem conclusões
      stats: {
        promptTokens: courseData.usage?.promptTokens || 0,
        completionTokens: courseData.usage?.completionTokens || 0,
        totalTokens: courseData.usage?.totalTokens || 0,
        generatedAt: new Date().toISOString()
      },
      modules: processedModules,
      finalExam: (courseData.finalExam || []).map((exam, i) => ({
        _key: `exam_final_${i}_${Date.now()}`,
        ...exam,
        correctAnswer: String(exam.correctAnswer)
      }))
    };

    if (coverResult?.assetId) {
      doc.thumbnail = { _type: 'image', asset: { _type: 'reference', _ref: coverResult.assetId } };
      doc.externalImageId = coverResult.externalImageId;
    }

    sendProgress(90, "Salvando curso na sua biblioteca...");
    const result = await client.create(doc);

    // 5. ATUALIZAÇÃO DO USUÁRIO (XP E CRÉDITOS)
    // Multiplicador de XP: Iniciante (1.0x), Intermediário (1.5x)
    const xpMultiplier = forcedLevel === 'iniciante' ? 1 : 1.5;
    const gainedXp = Math.round(((processedModules.length * 100) + 500) * xpMultiplier);

    const userPatch = client.patch(targetUserId);
    
    // Consome o crédito e marca o tempo da geração
    if (user.role !== 'admin') {
      userPatch.set({ credits: 0, "stats.lastLogin": new Date().toISOString() });
    } else {
      userPatch.set({ "stats.lastLogin": new Date().toISOString() });
    }

    await userPatch
      .inc({ "stats.coursesCreated": 1, "stats.totalXp": gainedXp })
      .commit();

    sendProgress(100, 'Curso pronto para começar!', { 
        courseId: result._id, 
        slug: doc.slug.current,
        xpGained: gainedXp 
    });
    
    res.end();

  } catch (error) {
    console.error("❌ Erro Crítico no Controller:", error);
    res.write(`data: ${JSON.stringify({ error: "ERROR", message: error.message })}\n\n`);
    res.end();
  }
};

module.exports = { generateCourse };