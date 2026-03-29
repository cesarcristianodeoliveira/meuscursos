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
    // Reset diário de créditos (3 para free)
    await client.patch(user._id)
      .set({ credits: 3, "stats.lastLogin": now.toISOString() })
      .commit();
    return true;
  }
  return user.credits > 0;
};

const generateCourse = async (req, res) => {
  req.setTimeout(600000); 
  const { topic, provider, userId } = req.body;
  
  // Se não houver userId, o autor é o Admin, mas o nível é restrito
  const isGuest = !userId;
  const targetUserId = userId || ADMIN_ID;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = (progress, message, extra = {}) => {
    res.write(`data: ${JSON.stringify({ progress, message, ...extra })}\n\n`);
  };

  try {
    sendProgress(5, "Validando acesso...");
    const user = await client.fetch(`*[_type == "user" && _id == $targetUserId][0]`, { targetUserId });
    
    if (!user) throw new Error('Usuário não encontrado.');

    const canGenerate = await updateAndCheckCredits(user);
    if (!canGenerate && user.role !== 'admin') {
      throw new Error('Limite diário atingido. Tente novamente em 24h.');
    }

    // Regras de Nível e Conteúdo
    // Visitantes OU usuários Free SEMPRE geram nível iniciante
    const isFullAccess = !isGuest && (user.role === 'admin' || user.plan === 'pro');
    const forcedLevel = isFullAccess ? 'intermediario' : 'iniciante';

    sendProgress(20, `IA estruturando curso ${forcedLevel}...`);
    
    // Passamos as restrições para o aiService
    const courseData = await generateCourseContent(topic, provider, { 
      level: forcedLevel,
      isGuest: isGuest 
    });

    sendProgress(60, "Gerando identidade visual...");
    const coverResult = await fetchAndUploadImage(courseData.searchQuery || topic, courseData.category?.name);

    // --- LÓGICA DE TEMPO REAL ---
    // Estimativa: 15 min por módulo + 5 min por exercício + 10 min prova final
    const totalMinutes = (courseData.modules?.length * 15) + (courseData.modules?.length * 5) + 10;
    const estimatedHours = Math.max(1, Math.round(totalMinutes / 60));

    // --- PROCESSAMENTO DE MÓDULOS ---
    const processedModules = (courseData.modules || []).map((mod, index) => ({
      _key: `mod_${index}_${Date.now()}`,
      title: mod.title,
      content: mod.content,
      exercises: (mod.exercises || []).map(ex => ({
        _key: `ex_${Math.random().toString(36).substr(2, 9)}`,
        ...ex,
        correctAnswer: String(ex.correctAnswer)
      }))
    }));

    // --- MONTAGEM DO DOCUMENTO ---
    const doc = {
      _type: 'course',
      title: courseData.title || topic,
      slug: { _type: 'slug', current: formatSlug(courseData.title || topic) },
      author: { _type: 'reference', _ref: targetUserId },
      description: courseData.description,
      estimatedTime: estimatedHours, // Tempo Real
      rating: 0, // Começa zerado (Realismo)
      level: forcedLevel,
      isPublished: true,
      aiProvider: courseData.aiProvider,
      aiModel: courseData.aiModel,
      category: {
        name: courseData.category?.name || "Geral",
        slug: formatSlug(courseData.category?.name || "geral")
      },
      // Tags: Se iniciante, limita a 3
      tags: !isFullAccess ? (courseData.tags || []).slice(0, 3) : courseData.tags,
      
      // Referências de Alunos (Iniciam Vazias)
      enrolledStudents: [],
      completedStudents: [],

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

    if (coverResult?.assetId) {
      doc.thumbnail = {
        _type: 'image',
        asset: { _type: 'reference', _ref: coverResult.assetId }
      };
      doc.externalImageId = coverResult.externalImageId;
    }

    sendProgress(95, "Finalizando curso...");
    const result = await client.create(doc);

    // --- ATUALIZAÇÃO DO USUÁRIO (CRÉDITOS, XP E STATS) ---
    // Calculo de XP: 100 por módulo + 500 por criar o curso
    const gainedXp = (processedModules.length * 100) + 500;

    const userPatch = client.patch(targetUserId);
    
    if (user.role !== 'admin') {
      userPatch.dec({ credits: 1 });
    }

    // Atualiza estatísticas reais e XP
    await userPatch
      .inc({ 
        "stats.coursesCreated": 1, 
        "stats.totalXp": gainedXp 
      })
      .commit();

    sendProgress(100, 'Curso Finalizado!', { 
        courseId: result._id, 
        slug: doc.slug.current,
        xpGained: gainedXp 
    });
    res.end();

  } catch (error) {
    console.error("❌ Erro no Controller:", error);
    res.write(`data: ${JSON.stringify({ error: "ERROR", message: error.message })}\n\n`);
    res.end();
  }
};

module.exports = { generateCourse };